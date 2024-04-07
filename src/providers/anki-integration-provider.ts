import { Err, Ok, Result } from "ts-results";
import { ANKI_CONNECT_URL } from "../config";
import { IAnkiNote } from "../contracts/anki";

type AnkiRequestResultType<T> = {
    error: string | null;
    result: T;
};

export class AnkiIntegrationProvider {
    getAllNotes = async () => {
        try {
            const notesIdsResult = await fetch(ANKI_CONNECT_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "findNotes",
                    version: 6,
                    params: {
                        query: `deck:_*`,
                    },
                }),
                headers: { "Content-Type": "application/json" },
            })
                .then((response) => response.json())
                .then((data: unknown) => data as AnkiRequestResultType<string[]>);

            if (notesIdsResult.error) {
                return Err("Error getting notes ids");
            }

            const cardIdsInDecksResult = await fetch(ANKI_CONNECT_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "getDecks",
                    version: 6,
                    params: {
                        cards: notesIdsResult.result,
                    },
                }),
                headers: { "Content-Type": "application/json" },
            })
                .then((response) => response.json())
                .then((data: unknown) => data as AnkiRequestResultType<{ [key: string]: string[] }>);

            if (cardIdsInDecksResult.error) {
                return Err("Error getting cardIdsInDecks");
            }

            const noteIdToDeckMap = Object.keys(cardIdsInDecksResult.result).reduce(
                (acc, deckName) => {
                    const noteIds = cardIdsInDecksResult.result[deckName];
                    noteIds.forEach((noteId) => {
                        acc[noteId] = deckName;
                    });

                    return acc;
                },
                {} as { [key: string]: string }
            );

            const notesDataResult = await fetch(ANKI_CONNECT_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "notesInfo",
                    version: 6,
                    params: {
                        notes: notesIdsResult.result,
                    },
                }),
                headers: { "Content-Type": "application/json" },
            })
                .then((response) => response.json())
                .then((data: unknown) => data as AnkiRequestResultType<IAnkiNote[]>);

            if (notesDataResult.error) {
                return Err("Error getting notes");
            }

            const notes = notesDataResult.result.map((note) => {
                note.deckName = noteIdToDeckMap[note.noteId];
                return note;
            });

            return Ok(notes);
        } catch (error) {
            console.error(error);
            return Err("Error getting notes");
        }
    };

    getAllDecksNames = async (): Promise<Result<string[], string>> => {
        try {
            const deckNamesResult = await fetch(ANKI_CONNECT_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "deckNames",
                    version: 6,
                }),
                headers: { "Content-Type": "application/json" },
            })
                .then((response) => response.json())
                .then((data: unknown) => {
                    return data as AnkiRequestResultType<string[]>;
                });

            if (deckNamesResult.error) {
                return Err("Error getting notes");
            }

            return Ok(deckNamesResult.result);
        } catch (error) {
            console.error(error);
            return Err("Error getting decks");
        }
    };
}
