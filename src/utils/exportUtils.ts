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

    const stringBuilder: string[] = [];
    stringBuilder.push(`START\n`);
    for (const field in note.fields) {
        stringBuilder.push(`${field}:\n`);
        stringBuilder.push(note.fields[field].value);
    }

    stringBuilder.push(`<-- ID:${note.noteId} -->\n`);
    stringBuilder.push(`END\n`);

    fs.writeFileSync(path.normalize(`${deckDir}${deckPath}/${note.noteId}.md`), stringBuilder.join(""));
};

export { createDeckFolderStructure, exportAnkiNoteToDeck };
