import type busboy from 'busboy';
import type { Container } from '@chubbyts/chubbyts-dic-types/dist/container';
import { createAbstractFactory } from '@chubbyts/chubbyts-dic-config-factory/dist/dic-config-factory';
import type { Middleware } from '@chubbyts/chubbyts-undici-server/dist/server';
import { createMultipartMiddleware } from './multipart-middleware.js';

/**
 * The configuration read by the service factory from `config.chubbyts.multipart` (or `config.chubbyts.multipart.<name>`
 * for named factories), see the options of `createMultipartMiddleware`.
 */
export type MultipartConfig = {
  limits?: busboy.Limits;
};

type Config = {
  chubbyts?: {
    multipart?: MultipartConfig | Record<string, MultipartConfig>;
  };
};

export const multipartMiddlewareServiceFactory = createAbstractFactory(
  (container: Container, { resolveConfig }): Middleware => {
    const { limits } = resolveConfig(container.get<Config>('config').chubbyts?.multipart ?? {});

    return createMultipartMiddleware(limits);
  },
);
