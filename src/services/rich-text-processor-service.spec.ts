import { describe, expect, it } from "vitest";
import { RichTextProcessorService } from "./rich-text-processor-service";
import { Ok } from "ts-results-es";

describe("RichTextProcessorService", () => {
    describe("convertHtmlToMarkdown", () => {
        it("should strip away Obsidian appLink Artifact", async () => {
            const html = `Some question?<br>Another line. <br><a href="obsidian://open?vault=someVault;file=someDir%2FsomeFile.md" class="obsidian-link">Obsidian</a>`;
            const textProcessor = new RichTextProcessorService();

            const markdown = await textProcessor.convertHtmlToMarkdown(html);

            expect(markdown).toEqual(Ok("Some question?\nAnother line.\n"));
        });
    });
});
