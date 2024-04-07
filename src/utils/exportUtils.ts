import fs from "fs";
import { IAnkiNote } from "../contracts/anki";
import path from "path";

const createDeckFolderStructure = (decks: string[], deckDir: string = "./decks/"): void => {
    decks
        .sort((a, b) => a.length - b.length)
        .forEach((deck) => {
            const deckPath = deck.split("::").join("/");

            fs.mkdirSync(`${deckDir}${deckPath}`, { recursive: true });
        });
};

const exportAnkiNoteToDeck = (note: IAnkiNote, deckDir: string = "./decks/"): void => {
    const deckPath = note.deckName.split("::").join("/");

    if (!fs.existsSync(`${deckDir}${deckPath}`)) {
        createDeckFolderStructure([note.deckName], deckDir);
    }

    fs.writeFileSync(path.normalize(`${deckDir}${deckPath}/${note.noteId}.json`), JSON.stringify(note));
};

export { createDeckFolderStructure, exportAnkiNoteToDeck };
