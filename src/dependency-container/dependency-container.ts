import { AsyncLocalStorage } from "node:async_hooks";
import { Request, Response, NextFunction } from "express";
import { AnkiService } from "../services/anki-integration-service";
import { RichTextProcessorService } from "../services/rich-text-processor-service";

const DIContainer = new AsyncLocalStorage();

const serviceFactories = {
    ankiService: () => new AnkiService(),
    richTextProcessorService: () => new RichTextProcessorService(),
};

const dependencyInjectionContainerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const state = { serviceFactories };
    DIContainer.run(state, () => {
        next();
    });
};

const getDIContext = async () => {
    return DIContainer.getStore() as { serviceFactories: typeof serviceFactories };
};

export { dependencyInjectionContainerMiddleware, getDIContext };
