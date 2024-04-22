import express from "express";
import bodyParser from "body-parser";
import { AnkiIntegrationProvider } from "./providers/anki-integration-provider";
import { AnkiIntegrationService } from "./services/anki-integration-service";
import { dependencyInjectionContainerMiddleware, getDIContext } from "./dependency-container/dependency-container";

const app = express();
const port = 3005;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(dependencyInjectionContainerMiddleware);

app.get("/", (req, res) => {
    res.send("<h1> DEV SERVER </h1> <p> intended to be used for testing only </p>");
});

app.get("/anki", (req, res) => {
    fetch("http://127.0.0.1:8765", {
        method: "POST",
        body: JSON.stringify({
            action: "cardsInfo",
            version: 6,
            params: {
                cards: [1705403507801],
            },
        }),
        headers: { "Content-Type": "application/json" },
    })
        .then((response) => response.json())
        .then((data) => res.send(data.result))
        .catch((error) => {
            console.log(error);
            res.send(error);
        });
});

app.get("/anki/notes", async (req, res) => {
    try {
        const ankiIntegrationProvider = new AnkiIntegrationProvider();
        const results = await ankiIntegrationProvider.getAllNotes();
        if (results.isErr()) {
            console.error(results.error);

            res.status(500).send("Error getting notes");
            return;
        }

        const context = await getDIContext();
        console.log(context);

        const richTextProcessorService = context.serviceFactories.createRichTextProcessorService();

        const newAnkiNotes = [];
        for (const note of results.value) {
            const promises = Object.keys(note.fields).map(async (fieldName) => {
                const field = note.fields[fieldName];

                const res = await richTextProcessorService.convertHtmlToMarkdown(field.value);
                if (res.isErr()) {
                    console.error(res.error);
                    return;
                }

                return {
                    name: fieldName,
                    value: res.value,
                };
            });

            const newFields = await Promise.all(promises);

            newAnkiNotes.push({
                ...note,
                fields: newFields,
            });
        }

        res.status(200).send(newAnkiNotes);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error getting notes");
    }
});

app.get("/anki/decks", async (req, res) => {
    try {
        const ankiIntegrationProvider = new AnkiIntegrationProvider();
        const results = await ankiIntegrationProvider.getAllDecksNames();
        if (results.isErr()) {
            res.status(500).send("Error getting decks");
            return;
        }

        return res.send(results.value);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error - Something went wrong.");
    }
});

app.get("/anki/sync", async (req, res) => {
    const ankiService = new AnkiIntegrationService();
    await ankiService.syncNotes();

    res.status(202).send(`Notes Synced - ${new Date().toISOString()}`);
});

app.listen(port, () => {
    console.log(`Dev Server listening for actions on port ${port}.`);
});
