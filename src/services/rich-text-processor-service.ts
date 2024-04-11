import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import { Err, Ok } from "ts-results-es";

class RichTextProcessorService {
    private processor = unified()
        .use(rehypeParse) // Parse HTML to a syntax tree
        .use(rehypeRemark) // Turn HTML syntax tree to markdown syntax tree
        .use(remarkStringify); // Serialize HTML syntax tree

    constructor() {}

    convertHtmlToMarkdown(html: string) {
        return this.processor
            .process(html)
            .then((file) => Ok(String(file)))
            .catch((error) => {
                console.error("Error while converting HTML to Markdown", error);
                return Err("Error while converting HTML to Markdown");
            });
    }
}
export { RichTextProcessorService };
