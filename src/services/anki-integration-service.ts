import { Err } from "ts-results-es";
import { createDeckFolderStructure, exportAnkiNoteToDeck } from "../utils/exportUtils";
import path from "path";
import { getDIContext } from "../../src/dependency-container/dependency-container";
import { IAnkiNote } from "../../src/contracts/anki";

export class AnkiIntegrationService {
    async syncNotes() {
        const { serviceFactories, providersFactories } = await getDIContext();
        const ankiIntegrationProvider = providersFactories.createAnkiIntegrationProvider();

        const decksResult = await ankiIntegrationProvider.getAllDecksNames();

        if (decksResult.isErr()) {
            console.error(decksResult.error);

            return Err("Error getting deck names");
        }

        createDeckFolderStructure(decksResult.value);

        const notesResults = await ankiIntegrationProvider.getAllNotes();

        if (notesResults.isErr()) {
            console.error(notesResults.error);

            return Err("Error getting notes");
        }

        const richTextProcessorService = serviceFactories.createRichTextProcessorService();

        const ignoredModels = ["!myImageOcclusion", "Occlusion"];
        const notesToExport = notesResults.value.filter((note) => {
            return !ignoredModels.includes(note.modelName);
        });

        const newAnkiNotes = [];
        for (const note of notesToExport) {
            const promises = Object.keys(note.fields).map(async (fieldName) => {
                const field = note.fields[fieldName];

                const res = await richTextProcessorService.convertHtmlToMarkdown(field.value);
                if (res.isErr()) {
                    console.error(res.error);
                    return;
                }

                return {
                    name: fieldName,
                    value: res.value,
                    order: field.order,
                };
            });

            const processFields = await Promise.all(promises);

            const newFields = processFields
                .filter(
                    (
                        item
                    ): item is {
                        name: string;
                        value: string;
                        order: number;
                    } => item != undefined
                )
                .reduce(
                    (acc, field) => {
                        acc[field.name] = {
                            value: field.value,
                            order: field.order,
                        };

                        return acc;
                    },
                    {} as IAnkiNote["fields"]
                );

            newAnkiNotes.push({
                ...note,
                fields: newFields,
            });
        }

        newAnkiNotes.forEach((note) => {
            exportAnkiNoteToDeck(note, path.normalize(process.cwd() + "/decks/"));
        });
    }
}
