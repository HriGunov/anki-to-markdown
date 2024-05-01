import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnkiIntegrationService } from "./anki-integration-service";
import { DIContainer, IDIContext } from "../dependency-container/dependency-container";
import { AnkiIntegrationProvider } from "../providers/anki-integration-provider";
import { RichTextProcessorService } from "./rich-text-processor-service";
import { anyString, instance, mock, when } from "ts-mockito";
import { Ok } from "ts-results-es";
import { IAnkiNote } from "../contracts/anki";
import { exportAnkiNoteToDeck, createDeckFolderStructure } from "../utils/exportUtils";
import path from "path";

describe("AnkiIntegrationService", () => {
    describe("syncNotes", () => {
        const richTextProcessorServiceMock = mock<RichTextProcessorService>();
        const ankiIntegrationProviderMock = mock<AnkiIntegrationProvider>();
        let DIState: IDIContext;
        const baseTestAnkiNote: Partial<IAnkiNote> = {
            deckName: "deck1",
            noteId: "123456",
            fields: { field1: { value: "<div>field1</div>", order: 1 } },
        };

        beforeEach(() => {
            vi.mock("../utils/exportUtils", () => {
                return {
                    exportAnkiNoteToDeck: vi.fn(() => {}),
                    createDeckFolderStructure: vi.fn(() => {}),
                };
            });

            when(ankiIntegrationProviderMock.getAllDecksNames()).thenResolve(Ok(["deck1"]));
            when(ankiIntegrationProviderMock.getAllNotes()).thenResolve(
                Ok([baseTestAnkiNote] as unknown as IAnkiNote[])
            );

            when(richTextProcessorServiceMock.convertHtmlToMarkdown(anyString())).thenCall(async (arg: string) => {
                return Ok(arg);
            });

            DIState = {
                serviceFactories: {
                    createRichTextProcessorService: () => instance(richTextProcessorServiceMock),
                } as IDIContext["serviceFactories"],
                providersFactories: { createAnkiIntegrationProvider: () => instance(ankiIntegrationProviderMock) },
            };
        });

        afterEach(() => {
            vi.resetAllMocks();
        });

        it("should try to export notes", async () => {
            await DIContainer.run(DIState, async () => {
                const ankiIntegrationService = new AnkiIntegrationService();
                await ankiIntegrationService.syncNotes();
                expect(createDeckFolderStructure).toHaveBeenCalledTimes(1);

                expect(exportAnkiNoteToDeck).toHaveBeenCalledWith(
                    baseTestAnkiNote,
                    path.normalize(process.cwd() + "/decks/")
                );
            });
        });

        it("should remove stripedTags", async () => {
            await DIContainer.run(DIState, async () => {
                const ankiIntegrationService = new AnkiIntegrationService({ stripedTags: ["stripTag"] });

                const notesSetup = [
                    baseTestAnkiNote,
                    { ...baseTestAnkiNote, tags: ["stripTag"] },
                    { ...baseTestAnkiNote, tags: ["someOtherTag"] },
                ] as unknown as IAnkiNote[];

                const expectedNotes = [
                    baseTestAnkiNote,
                    { ...baseTestAnkiNote, tags: [] },
                    { ...baseTestAnkiNote, tags: ["someOtherTag"] },
                ] as unknown as IAnkiNote[];

                when(ankiIntegrationProviderMock.getAllNotes()).thenResolve(Ok(notesSetup));

                await ankiIntegrationService.syncNotes();
                expect(createDeckFolderStructure).toHaveBeenCalledTimes(1);

                expect(exportAnkiNoteToDeck).toHaveBeenCalledTimes(3);
                expectedNotes.forEach((note) => {
                    expect(exportAnkiNoteToDeck).toHaveBeenCalledWith(note, path.normalize(process.cwd() + "/decks/"));
                });
            });
        });
    });
});
