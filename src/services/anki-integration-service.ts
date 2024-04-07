import { Err } from "ts-results";
import { AnkiIntegrationProvider } from "../providers/anki-integration-provider";
import { createDeckFolderStructure, exportAnkiNoteToDeck } from "../utils/exportUtils";
import path from "path";

export class AnkiService {
    async syncNotes() {
        const ankiIntegrationProvider = new AnkiIntegrationProvider();

        const decksResult = await ankiIntegrationProvider.getAllDecksNames();

        if (decksResult.err) {
            console.error(decksResult.val);

            return Err("Error getting deck names");
        }

        createDeckFolderStructure(decksResult.val);

        const notesResults = await ankiIntegrationProvider.getAllNotes();

        if (notesResults.err) {
            console.error(notesResults.val);

            return Err("Error getting notes");
        }

        notesResults.val.forEach((note) => {
            exportAnkiNoteToDeck(note, path.normalize(process.cwd() + "/decks/"));
        });
    }
}
