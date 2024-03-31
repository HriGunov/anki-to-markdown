import fs from "fs";

const createDeckFolderStructure = (decks: string[]): void => {
    decks
        .sort((a, b) => a.length - b.length)
        .forEach((deck) => {
            const deckPath = deck.split("::").join("/");

            // console.log(`Creating deck folder structure for ${deckPath}`);

            fs.mkdirSync(`./decks/${deckPath}`, { recursive: true });
            // fs.mkdirSync(`./decks/${deck}`, { recursive: true });
        });
};

export { createDeckFolderStructure };
