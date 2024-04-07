export type IAnkiNote = {
    noteId: string;
    deckName: string;
    modelName: string;
    tags: string[];
    fields: { [key: string]: { value: string; order: number } };
    cards: string[];
};
