import { describe, expect, test, afterEach } from "@jest/globals";
import { createDeckFolderStructure, exportAnkiNoteToDeck } from "./exportUtils";
import fsMock from "mock-fs";
import fs from "fs";
import { IAnkiNote } from "../contracts/anki";
import { cwd } from "process";
import path from "path";

describe("createDeckFolderStructure", () => {
    afterEach(() => {
        fsMock.restore();
    });

    test("should create deck folder structure", () => {
        //use mock-fs
        fsMock({
            "./decks": {},
        });

        const decks = [
            "deck1",
            "deck2",
            "deck3",
            "deck1::sub1deck1",
            "deck1::sub1deck2",
            "deck1::sub1deck3",
            "deck1::sub1deck1::sub2deck1",
            "deck1::sub1deck1::sub2deck2",
            "deck1::sub1deck1::sub2deck3",
            "deck1::sub1deck2::sub2deck1",
            "deck1::sub1deck2::sub2deck2",
            "deck1::sub1deck2::sub2deck3",
            "deck1::sub1deck3::sub2deck1",
            "deck1::sub1deck3::sub2deck2",
            "deck1::sub1deck3::sub2deck3",
        ];

        createDeckFolderStructure(decks);

        //expect folder structure to be created
        decks.forEach((deck) => {
            const deckPath = deck.split("::").join("/");
            expect(fs.existsSync(`./decks/${deckPath}`)).toBe(true);
        });
    });
});

describe("exportAnkiNoteToDeck", () => {
    afterEach(() => {
        fsMock.restore();
    });

    test("test ", () => {
        const a = cwd();

        fsMock({
            "./decks/": {},
        });

        const b = cwd();

        expect(a).toBe(b);
    });

    test("should create deck folder structure", () => {
        //use mock-fs
        fsMock({
            "./decks/": {},
        });

        //Given anki notes
        const testData: IAnkiNote[] = [
            {
                noteId: "1",
                deckName: "deck1",
                modelName: "model1",

                tags: ["tag1"],
                fields: {
                    field1: { value: "value1", order: 1 },
                    field2: { value: "value2", order: 2 },
                },
                cards: ["card1"],
            },
            {
                noteId: "2",
                deckName: "deck2",
                modelName: "model2",
                tags: ["tag2"],
                fields: {
                    field1: { value: "value1", order: 1 },
                    field2: { value: "value2", order: 2 },
                },
                cards: ["card1"],
            },
            {
                noteId: "3",
                deckName: "deck1::sub1deck1::sub2deck1",
                modelName: "model1",
                tags: ["tag1"],
                fields: {
                    field1: { value: "value1", order: 1 },
                    field2: { value: "value2", order: 2 },
                    field3: { value: "value3", order: 3 },
                },
                cards: ["card3"],
            },
        ];

        //expect folder structure to be created
        testData.forEach((note) => {
            exportAnkiNoteToDeck(note, path.normalize(cwd() + "/decks/"));
            const deckPath = note.deckName.split("::").join("/");

            expect(fs.existsSync(`./decks/${deckPath}/${note.noteId}.json`)).toBe(true);
        });
    });
});
