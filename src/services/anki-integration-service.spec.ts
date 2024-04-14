import { afterEach, describe, expect, it, vi } from "vitest";
import { AnkiIntegrationService } from "./anki-integration-service";
import { DIContainer } from "../dependency-container/dependency-container";
import { AnkiIntegrationProvider } from "../providers/anki-integration-provider";
import { RichTextProcessorService } from "./rich-text-processor-service";
import { anyString, instance, mock, when } from "ts-mockito";
import { Ok } from "ts-results-es";
import { IAnkiNote } from "../contracts/anki";
import { exportAnkiNoteToDeck, createDeckFolderStructure } from "../utils/exportUtils";
import path from "path";

describe("AnkiIntegrationService", () => {
    describe("syncNotes", () => {
        it("should try to export notes", async () => {
            const ankiNoteToExport: Partial<IAnkiNote> = {
                deckName: "deck1",
                noteId: "123456",
                fields: { field1: { value: "<div>field1</div>", order: 1 } },
            };

            vi.mock("../utils/exportUtils", () => {
                return {
                    exportAnkiNoteToDeck: vi.fn((...params) => {
                        console.log({ params });
                    }),
                    createDeckFolderStructure: vi.fn((...params) => {
                        console.log({ params });
                    }),
                };
            });

            const ankiIntegrationProviderMock = mock<AnkiIntegrationProvider>();
            when(ankiIntegrationProviderMock.getAllDecksNames()).thenResolve(Ok(["deck1"]));
            when(ankiIntegrationProviderMock.getAllNotes()).thenResolve(
                Ok([ankiNoteToExport] as unknown as IAnkiNote[])
            );

            const richTextProcessorServiceMock = mock<RichTextProcessorService>();
            when(richTextProcessorServiceMock.convertHtmlToMarkdown(anyString())).thenCall(async (arg: string) => {
                return Ok(arg);
            });

            const DIState = {
                serviceFactories: { createRichTextProcessorService: () => instance(richTextProcessorServiceMock) },
                providersFactories: { createAnkiIntegrationProvider: () => instance(ankiIntegrationProviderMock) },
            };

            await DIContainer.run(DIState, async () => {
                const ankiIntegrationService = new AnkiIntegrationService();
                await ankiIntegrationService.syncNotes();
                expect(createDeckFolderStructure).toHaveBeenCalledTimes(1);

                expect(exportAnkiNoteToDeck).toHaveBeenCalledWith(
                    ankiNoteToExport,
                    path.normalize(process.cwd() + "/decks/")
                );
            });
        });
    });
});
