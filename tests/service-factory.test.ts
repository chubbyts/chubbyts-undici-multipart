import { describe, expect, test } from 'vitest';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import type { Container } from '@chubbyts/chubbyts-dic-types/dist/container';
import type { ConfigFactory } from '@chubbyts/chubbyts-dic-config/dist/dic-config';
import { createContainerByConfigFactory } from '@chubbyts/chubbyts-dic-config/dist/dic-config';
import type { Handler, Middleware } from '@chubbyts/chubbyts-undici-server/dist/server';
import { FormData, Response, ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { MultipartConfig } from '../src/service-factory';
import { multipartMiddlewareServiceFactory } from '../src/service-factory';

// createMultipartMiddleware returns an opaque closure, so the wiring gets proven by exercising the created middleware
// against a multipart request: the configured limits decide how many fields reach the handler

const createMultipartRequest = (): ServerRequest => {
  const formData = new FormData();
  formData.append('first', 'one');
  formData.append('second', 'two');

  return new ServerRequest('https://example.com/resource', { method: 'POST', body: formData });
};

const expectBody = async (middleware: Middleware, expectedBody: string) => {
  const [handler, handlerMocks] = useFunctionMock<Handler>([
    {
      callback: async (serverRequest: ServerRequest): Promise<Response> => {
        expect(serverRequest.headers.get('content-type')).toBe('application/x-www-form-urlencoded');
        expect(await serverRequest.text()).toBe(expectedBody);

        return new Response(undefined, { status: 204 });
      },
    },
  ]);

  const response = await middleware(createMultipartRequest(), handler);

  expect(response.status).toBe(204);

  expect(handlerMocks).toHaveLength(0);
};

describe('multipartMiddlewareServiceFactory', () => {
  test('without config', async () => {
    const [container, containerMocks] = useObjectMock<Container>([{ name: 'get', parameters: ['config'], return: {} }]);

    const service = multipartMiddlewareServiceFactory()(container);

    await expectBody(service, 'first=one&second=two&');

    expect(containerMocks).toHaveLength(0);
  });

  test('without name', async () => {
    const multipartConfig: MultipartConfig = { limits: { fields: 1 } };

    const [container, containerMocks] = useObjectMock<Container>([
      { name: 'get', parameters: ['config'], return: { chubbyts: { multipart: multipartConfig } } },
    ]);

    const service = multipartMiddlewareServiceFactory()(container);

    // the configured limits get passed through: only the first field survives
    await expectBody(service, 'first=one&');

    expect(containerMocks).toHaveLength(0);
  });

  test('with name', async () => {
    const [container, containerMocks] = useObjectMock<Container>([
      {
        name: 'get',
        parameters: ['config'],
        return: {
          chubbyts: {
            multipart: {
              api: { limits: { fields: 1 } },
              admin: { limits: { fields: 2 } },
            },
          },
        },
      },
    ]);

    const service = multipartMiddlewareServiceFactory('api')(container);

    await expectBody(service, 'first=one&');

    expect(containerMocks).toHaveLength(0);
  });

  test('with chubbyts-dic-config container', async () => {
    const container = createContainerByConfigFactory({
      chubbyts: {
        multipart: {
          limits: { fields: 1 },
        } satisfies MultipartConfig,
      },
      dependencies: {
        factories: new Map<string, ConfigFactory>([['multipartMiddleware', multipartMiddlewareServiceFactory()]]),
      },
    })();

    await expectBody(container.get<Middleware>('multipartMiddleware'), 'first=one&');
  });
});
