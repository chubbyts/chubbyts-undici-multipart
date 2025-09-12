import { readFileSync, promises as fs } from 'fs';
import { tmpdir } from 'os';
import { createHash } from 'crypto';
import { basename } from 'path';
import { beforeEach, describe, expect, test } from 'vitest';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { parse } from 'qs';
import type { Handler } from '@chubbyts/chubbyts-undici-server/dist/server';
import { Response, ServerRequest, FormData } from '@chubbyts/chubbyts-undici-server/dist/server';
import { createMultipartMiddleware } from '../src/multipart-middleware';
const redImagePath = process.cwd() + '/tests/resources/red.png';
const greenImagePath = process.cwd() + '/tests/resources/green.png';
const blueImagePath = process.cwd() + '/tests/resources/blue.png';

const sha1 = (input: string | Buffer) => createHash('sha1').update(input).digest('hex');

const createFormData = (): FormData => {
  const formData = new FormData();
  formData.append('id', '123e4567-e89b-12d3-a456-426655440000');
  formData.append('name', 'John Doe');
  formData.append(
    'address',
    JSON.stringify(
      {
        street: '3, Garden St',
        city: 'Hillsbery, UT',
      },
      null,
      2,
    ),
  );

  formData.append('red', new Blob([readFileSync(redImagePath)], { type: 'image/png' }), basename(redImagePath));
  formData.append('green', new Blob([readFileSync(greenImagePath)], { type: 'image/png' }), basename(greenImagePath));
  formData.append('blue', new Blob([readFileSync(blueImagePath)], { type: 'image/png' }), basename(blueImagePath));

  return formData;
};

beforeEach(async () => {
  await fs.rm(`${tmpdir()}/multipart`, { force: true, recursive: true });
});

describe('createMultipartMiddleware', () => {
  test('without body', async () => {
    const serverRequest = new ServerRequest('https://example.com', { method: 'post', body: null });
    const response = new Response();

    const [handler, handlerMocks] = useFunctionMock<Handler>([
      {
        parameters: [serverRequest],
        return: Promise.resolve(response),
      },
    ]);

    const multipartMiddleware = createMultipartMiddleware();

    expect(await multipartMiddleware(serverRequest, handler)).toBe(response);

    expect(handlerMocks.length).toBe(0);
  });

  test('without content-type', async () => {
    const serverRequest = new ServerRequest('https://example.com', { method: 'post', body: 'somebody' });
    const response = new Response();

    const [handler, handlerMocks] = useFunctionMock<Handler>([
      {
        parameters: [serverRequest],
        return: Promise.resolve(response),
      },
    ]);

    const multipartMiddleware = createMultipartMiddleware();

    expect(await multipartMiddleware(serverRequest, handler)).toBe(response);

    expect(handlerMocks.length).toBe(0);
  });

  test('without multipart/form-data', async () => {
    const serverRequest = new ServerRequest('https://example.com', {
      method: 'post',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'somebody',
    });
    const response = new Response();

    const [handler, handlerMocks] = useFunctionMock<Handler>([
      {
        parameters: [serverRequest],
        return: Promise.resolve(response),
      },
    ]);

    const multipartMiddleware = createMultipartMiddleware();

    expect(await multipartMiddleware(serverRequest, handler)).toBe(response);

    expect(handlerMocks.length).toBe(0);
  });

  describe('with multipart/form-data', () => {
    test('successful', async () => {
      const formData = createFormData();

      const serverRequest = new ServerRequest('https://example.com', {
        method: 'post',
        body: formData,
      });

      const response = new Response();

      const [handler, handlerMocks] = useFunctionMock<Handler>([
        {
          callback: async (givenRequest: ServerRequest) => {
            expect(Object.fromEntries([...givenRequest.headers.entries()])).toMatchInlineSnapshot(`
              {
                "content-type": "application/x-www-form-urlencoded",
              }
            `);

            const data = parse(await givenRequest.text());

            const redImagePattern =
              /^(\/tmp\/multipart\/[0-9a-f]{128}\/[0-9a-f]{128}); filename=red.png; mimeType=image\/png/;
            const greenImagePattern =
              /^(\/tmp\/multipart\/[0-9a-f]{128}\/[0-9a-f]{128}); filename=green.png; mimeType=image\/png/;
            const blueImagePattern =
              /^(\/tmp\/multipart\/[0-9a-f]{128}\/[0-9a-f]{128}); filename=blue.png; mimeType=image\/png/;

            expect(data).toEqual({
              id: '123e4567-e89b-12d3-a456-426655440000',
              name: 'John Doe',
              address: '{\r\n  "street": "3, Garden St",\r\n  "city": "Hillsbery, UT"\r\n}',
              red: expect.stringMatching(redImagePattern),
              green: expect.stringMatching(greenImagePattern),
              blue: expect.stringMatching(blueImagePattern),
            });

            const temporaryRedImagePath = (data['red'] as string).match(redImagePattern)?.[1] as string;
            const temporaryGreenImagePath = (data['green'] as string).match(greenImagePattern)?.[1] as string;
            const temporaryBlueImagePath = (data['blue'] as string).match(blueImagePattern)?.[1] as string;

            const redImageSha1 = sha1(readFileSync(redImagePath));
            const greenImageSha1 = sha1(readFileSync(greenImagePath));
            const blueImageSha1 = sha1(readFileSync(blueImagePath));

            const temporaryRedImageSha1 = sha1(readFileSync(temporaryRedImagePath));
            const temporaryGreenImageSha1 = sha1(readFileSync(temporaryGreenImagePath));
            const temporaryBlueImageSha1 = sha1(readFileSync(temporaryBlueImagePath));

            // console.log({ redImagePath, redImageSha1, temporaryRedImagePath, temporaryRedImageSha1 });
            // console.log({ greenImagePath, greenImageSha1, temporaryGreenImagePath, temporaryGreenImageSha1 });
            // console.log({ blueImagePath, blueImageSha1, temporaryBlueImagePath, temporaryBlueImageSha1 });

            expect(redImageSha1).toBe(temporaryRedImageSha1);
            expect(greenImageSha1).toBe(temporaryGreenImageSha1);
            expect(blueImageSha1).toBe(temporaryBlueImageSha1);

            return response;
          },
        },
      ]);

      const multipartMiddleware = createMultipartMiddleware();

      expect(await multipartMiddleware(serverRequest, handler)).toBe(response);

      expect(handlerMocks.length).toBe(0);
    });

    test('allow only 1 file', async () => {
      const formData = createFormData();

      const serverRequest = new ServerRequest('https://example.com', {
        method: 'post',
        body: formData,
      });

      const response = new Response();

      const [handler, handlerMocks] = useFunctionMock<Handler>([
        {
          callback: async (givenRequest: ServerRequest) => {
            expect(Object.fromEntries([...givenRequest.headers.entries()])).toMatchInlineSnapshot(`
              {
                "content-type": "application/x-www-form-urlencoded",
              }
            `);

            const data = parse(await givenRequest.text());

            const redImagePattern =
              /^(\/tmp\/multipart\/[0-9a-f]{128}\/[0-9a-f]{128}); filename=red.png; mimeType=image\/png/;

            expect(data).toEqual({
              id: '123e4567-e89b-12d3-a456-426655440000',
              name: 'John Doe',
              address: '{\r\n  "street": "3, Garden St",\r\n  "city": "Hillsbery, UT"\r\n}',
              red: expect.stringMatching(redImagePattern),
            });

            const temporaryRedImagePath = (data['red'] as string).match(redImagePattern)?.[1] as string;

            const redImageSha1 = sha1(readFileSync(redImagePath));

            const temporaryRedImageSha1 = sha1(readFileSync(temporaryRedImagePath));

            // console.log({ redImagePath, redImageSha1, temporaryRedImagePath, temporaryRedImageSha1 });

            expect(redImageSha1).toBe(temporaryRedImageSha1);

            return response;
          },
        },
      ]);

      const multipartMiddleware = createMultipartMiddleware({ files: 1 });

      expect(await multipartMiddleware(serverRequest, handler)).toBe(response);

      expect(handlerMocks.length).toBe(0);
    });
  });
});
