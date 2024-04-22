import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import remarkGfm from "remark-gfm";
import { Err, Ok } from "ts-results-es";

//Override the default handler for <br> tag (https://github.github.com/gfm/#hard-line-break)
const brHandler = () => {
    return "\n";
};

class RichTextProcessorService {
    private processor = unified()
        .use(rehypeParse, {}) // Parse HTML to a syntax tree
        .use(rehypeRemark) // Turn HTML syntax tree to markdown syntax tree
        .use(remarkGfm) // Enable GitHub Flavored Markdown
        .use(remarkStringify, {
            handlers: {
                break: brHandler,
            },
            tightDefinitions: true,
        }); // Serialize HTML syntax tree

    constructor() {}

    async convertHtmlToMarkdown(html: string) {
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
