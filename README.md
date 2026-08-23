# chubbyts-undici-multipart

[![CI](https://github.com/chubbyts/chubbyts-undici-multipart/actions/workflows/ci.yml/badge.svg)](https://github.com/chubbyts/chubbyts-undici-multipart/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/chubbyts/chubbyts-undici-multipart/badge.svg?branch=master)](https://coveralls.io/github/chubbyts/chubbyts-undici-multipart?branch=master)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fchubbyts%2Fchubbyts-undici-multipart%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/chubbyts/chubbyts-undici-multipart/master)
[![npm-version](https://img.shields.io/npm/v/@chubbyts/chubbyts-undici-multipart.svg)](https://www.npmjs.com/package/@chubbyts/chubbyts-undici-multipart)

[![bugs](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-multipart&metric=bugs)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-multipart)
[![code_smells](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-multipart&metric=code_smells)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-multipart)
[![coverage](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-multipart&metric=coverage)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-multipart)
[![duplicated_lines_density](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-multipart&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-multipart)
[![ncloc](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-multipart&metric=ncloc)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-multipart)
[![sqale_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-multipart&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-multipart)
[![alert_status](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-multipart&metric=alert_status)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-multipart)
[![reliability_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-multipart&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-multipart)
[![security_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-multipart&metric=security_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-multipart)
[![sqale_index](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-multipart&metric=sqale_index)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-multipart)
[![vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-multipart&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-multipart)

## Description

A minimal multipart middleware for chubbyts-undici-server.

## Requirements

 * node: 22
 * [@chubbyts/chubbyts-dic-config-factory][6]: ^1.0.0
 * [@chubbyts/chubbyts-dic-types][4]: ^2.3.0
 * [@chubbyts/chubbyts-undici-server][2]: ^1.2.0
 * [busboy][3]: ^1.6.0

## Installation

Through [NPM](https://www.npmjs.com) as [@chubbyts/chubbyts-undici-multipart][1].

```sh
npm i @chubbyts/chubbyts-undici-multipart@^1.3.0
```

## Usage

```ts
import { createMultipartMiddleware } from '@chubbyts/chubbyts-undici-multipart/dist/multipart-middleware';
import type { Handler } from '@chubbyts/chubbyts-undici-server/dist/handler';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { Response } from '@chubbyts/chubbyts-undici-server/dist/server';

// if request original content-type was multipart/form-data, the current content-type and body is now application/x-www-form-urlencoded
const handler: Handler = async (request: ServerRequest): Promise<Response> ...;

const multipartMiddleware = createMultipartMiddleware();

const response = await multipartMiddleware(new ServerRequest(), handler);
```

### Example

#### Input

```
----------------------------394107496171408467161617
Content-Disposition: form-data; name="id"

123e4567-e89b-12d3-a456-426655440000
----------------------------394107496171408467161617
Content-Disposition: form-data; name="name"

John Doe
----------------------------394107496171408467161617
Content-Disposition: form-data; name="address"
Content-Type: application/json

{
  "street": "3, Garden St",
  "city": "Hillsbery, UT"
}
----------------------------394107496171408467161617
Content-Disposition: form-data; name="red"; filename="red.png"
Content-Type: image/png

<binary>
----------------------------394107496171408467161617
Content-Disposition: form-data; name="green"; filename="green.png"
Content-Type: image/png

<binary>
----------------------------394107496171408467161617
Content-Disposition: form-data; name="blue"; filename="blue.png"
Content-Type: image/png

<binary>
----------------------------394107496171408467161617--
```

#### Output

*Optimized for human readability*

```
id=123e4567-e89b-12d3-a456-426655440000&
name=John Doe&
address={\r\n  "street": "3, Garden St",\r\n  "city": "Hillsbery, UT"\r\n}&
red=/tmp/multipart/.../...; filename=red.png; mimeType=image/png&
green=/tmp/multipart/.../...; filename=green.png; mimeType=image/png&
blue=/tmp/multipart/.../...; filename=blue.png; mimeType=image/png&
```

### Service factory (chubbyts-dic-config)

The package ships a service factory (an abstract factory built on [chubbyts-dic-config-factory][6]) for a [chubbyts-dic-config][5] (or any [chubbyts-dic-types][4] compatible) container within `@chubbyts/chubbyts-undici-multipart/dist/service-factory`, configured through `config.chubbyts.multipart` (optional, see the `limits` of [busboy][3]):

```ts
import type { ConfigFactory } from '@chubbyts/chubbyts-dic-config/dist/dic-config';
import { createContainerByConfigFactory } from '@chubbyts/chubbyts-dic-config/dist/dic-config';
import type { MultipartConfig } from '@chubbyts/chubbyts-undici-multipart/dist/service-factory';
import { multipartMiddlewareServiceFactory } from '@chubbyts/chubbyts-undici-multipart/dist/service-factory';
import type { Middleware } from '@chubbyts/chubbyts-undici-server/dist/server';

const container = createContainerByConfigFactory({
  chubbyts: {
    multipart: {
      // limits: { fileSize: 10 * 1024 * 1024, files: 5 },
    } satisfies MultipartConfig,
  },
  dependencies: {
    factories: new Map<string, ConfigFactory>([['multipartMiddleware', multipartMiddlewareServiceFactory()]]),
  },
})();

const multipartMiddleware = container.get<Middleware>('multipartMiddleware');
```

#### With names

To use different limits for different parts of an api, the factory can be registered multiple times with a name: the config is then read from `config.chubbyts.multipart.<name>`.

```ts
const container = createContainerByConfigFactory({
  chubbyts: {
    multipart: {
      api: { limits: { fileSize: 1024 * 1024 } },
      admin: { limits: { fileSize: 100 * 1024 * 1024 } },
    } satisfies Record<string, MultipartConfig>,
  },
  dependencies: {
    factories: new Map<string, ConfigFactory>([
      ['multipartMiddlewareapi', multipartMiddlewareServiceFactory('api')],
      ['multipartMiddlewareadmin', multipartMiddlewareServiceFactory('admin')],
    ]),
  },
})();

const apiMultipartMiddleware = container.get<Middleware>('multipartMiddlewareapi');
const adminMultipartMiddleware = container.get<Middleware>('multipartMiddlewareadmin');
```


## Copyright

2026 Dominik Zogg

[1]: https://www.npmjs.com/package/@chubbyts/chubbyts-undici-multipart
[2]: https://www.npmjs.com/package/@chubbyts/chubbyts-undici-server
[3]: https://www.npmjs.com/package/busboy
[4]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-types
[5]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-config
[6]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-config-factory
