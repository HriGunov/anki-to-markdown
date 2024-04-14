import { AsyncLocalStorage } from "node:async_hooks";
import { Request, Response, NextFunction } from "express";
import { AnkiIntegrationService } from "../services/anki-integration-service";
import { RichTextProcessorService } from "../services/rich-text-processor-service";
import { AnkiIntegrationProvider } from "../providers/anki-integration-provider";

const DIContainer = new AsyncLocalStorage();

const serviceFactories = {
    createAnkiIntegrationService: () => new AnkiIntegrationService(),
    createRichTextProcessorService: () => new RichTextProcessorService(),
};

const providersFactories = {
    createAnkiIntegrationProvider: () => new AnkiIntegrationProvider(),
};

const dependencyInjectionContainerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const state = { serviceFactories, providersFactories };
    DIContainer.run(state, () => {
        next();
    });
};

const getDIContext = async () => {
    return DIContainer.getStore() as {
        serviceFactories: typeof serviceFactories;
        providersFactories: typeof providersFactories;
    };
};

export { dependencyInjectionContainerMiddleware, getDIContext, DIContainer };
