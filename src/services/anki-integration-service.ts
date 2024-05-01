import { Err } from "ts-results-es";
import { createDeckFolderStructure, exportAnkiNoteToDeck } from "../utils/exportUtils";
import path from "path";
import { getDIContext } from "../../src/dependency-container/dependency-container";
import { IAnkiNote } from "../../src/contracts/anki";

const defaultIgnoredCardTypes = ["!myImageOcclusion", "Occlusion"]; // Ignoring ImageOcclusion as they are not supported yet
const defaultStripedTags = ["Obsidian_to_Anki"];

type IOptions = {
    ignoredCardTypes?: string[];
    stripedTags?: string[];
};

export class AnkiIntegrationService {
    constructor(
        private options: IOptions = {
            ignoredCardTypes: defaultIgnoredCardTypes,
            stripedTags: defaultStripedTags,
        }
    ) {}

    async syncNotes() {
        const { providersFactories } = await getDIContext();
        const ankiIntegrationProvider = providersFactories.createAnkiIntegrationProvider();

        const decksResult = await ankiIntegrationProvider.getAllDecksNames();

        if (decksResult.isErr()) {
            console.error(decksResult.error);

            return Err("Error getting deck names");
        }

        const decks = decksResult.value;

        createDeckFolderStructure(decks);

        const notesResults = await ankiIntegrationProvider.getAllNotes();

        if (notesResults.isErr()) {
            console.error(notesResults.error);

            return Err("Error getting notes");
        }

        let notesToExport = notesResults.value;

        if (this.options.ignoredCardTypes?.length) {
            this.options.ignoredCardTypes.includes("!myImageOcclusion");

            notesToExport = notesToExport.filter((note) => {
                return !this.options.ignoredCardTypes!.includes(note.modelName);
            });
        }

        const processedNotes = await this.processNotes(notesToExport);

        processedNotes.forEach((note) => {
            exportAnkiNoteToDeck(note, path.normalize(process.cwd() + "/decks/"));
        });
    }

    private async processNotes(notes: IAnkiNote[]) {
        const { serviceFactories } = await getDIContext();
        const richTextProcessorService = serviceFactories.createRichTextProcessorService();
        const processedNotes = [];
        for (const note of notes) {
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

            const newFields = await Promise.all(promises);

            const processFields = newFields
                .filter(
                    (
                        item
                    ): item is {
                        name: string;
                        value: string;
                        order: number;
                    } => item != undefined
                )
                .reduce((acc, field) => {
                    acc[field.name] = {
                        value: field.value,
                        order: field.order,
                    };

                    return acc;
                }, {} as IAnkiNote["fields"]);

            const stripedTags = this.options.stripedTags;

            let processedTags = note.tags;
            if (stripedTags && note.tags?.length && note.tags.some((tag) => stripedTags.includes(tag))) {
                processedTags = note.tags.filter((tag) => !stripedTags.includes(tag));
            }

            processedNotes.push({
                ...note,
                fields: processFields,
                tags: processedTags,
            });
        }

        return processedNotes;
    }
}
