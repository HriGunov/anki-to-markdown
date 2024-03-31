import { afterAll, describe, expect, test } from "@jest/globals";
import { createDeckFolderStructure } from "./exportUtils";
import fsMock from "mock-fs";
import fs from "fs";

describe("createDeckFolderStructure", () => {
    afterAll(() => {
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
