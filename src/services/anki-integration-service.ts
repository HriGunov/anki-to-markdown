import { Err } from "ts-results-es";
import { AnkiIntegrationProvider } from "../providers/anki-integration-provider";
import { createDeckFolderStructure, exportAnkiNoteToDeck } from "../utils/exportUtils";
import path from "path";

export class AnkiService {
    async syncNotes() {
        const ankiIntegrationProvider = new AnkiIntegrationProvider();

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

        notesResults.value.forEach((note) => {
            exportAnkiNoteToDeck(note, path.normalize(process.cwd() + "/decks/"));
        });
    }
}
