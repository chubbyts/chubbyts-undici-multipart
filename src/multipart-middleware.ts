import { randomBytes } from 'crypto';
import { createWriteStream, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { PassThrough, Readable } from 'stream';
import { finished } from 'stream/promises';
import busboy from 'busboy';
import type { Handler, Middleware, Response } from '@chubbyts/chubbyts-undici-server/dist/server';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';

export const createMultipartMiddleware = (limits: busboy.Limits | undefined = undefined): Middleware => {
  return async (serverRequest: ServerRequest, handler: Handler): Promise<Response> => {
    const { body } = serverRequest;

    if (!body) {
      return handler(serverRequest);
    }

    const headers = Object.fromEntries([...serverRequest.headers.entries()]);

    const contentType = headers['content-type'];
    if (!contentType || !/multipart\/form-data/i.test(contentType) || !/boundary=/i.test(contentType)) {
      return handler(serverRequest);
    }

    const temporaryPath = `${tmpdir()}/multipart/${randomBytes(64).toString('hex')}`;
    mkdirSync(temporaryPath, { recursive: true });

    const fileFinishedPromises: Promise<void>[] = [];

    const newBody = new PassThrough();

    const multipartStream = busboy({ headers, limits });

    multipartStream.on('file', (name, readableFile, info) => {
      const { filename, mimeType } = info;

      const temporaryFilePath = `${temporaryPath}/${randomBytes(64).toString('hex')}`;

      const temporaryFileStream = createWriteStream(temporaryFilePath);
      readableFile.pipe(temporaryFileStream);

      // eslint-disable-next-line functional/immutable-data
      fileFinishedPromises.push(finished(temporaryFileStream));

      const value = `${temporaryFilePath}; filename=${filename}; mimeType=${mimeType}`;
      newBody.write(`${encodeURIComponent(name)}=${encodeURIComponent(value)}&`);
    });

    multipartStream.on('field', (name, value) => {
      newBody.write(`${encodeURIComponent(name)}=${encodeURIComponent(value)}&`);
    });

    multipartStream.on('finish', async () => {
      if (fileFinishedPromises.length > 0) {
        await Promise.all(fileFinishedPromises);
      }
      newBody.end();
    });

    Readable.fromWeb(body).pipe(multipartStream);

    return handler(
      new ServerRequest(serverRequest, {
        headers: {
          ...headers,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: Readable.toWeb(newBody),
        duplex: 'half',
      }),
    );
  };
};
