import type { INestApplication } from "@nestjs/common";
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";

import { API_DOCUMENTATION_PATH, OPENAPI_JSON_PATH } from "./api-routes";

function scalarContentSecurityPolicy({
  isProduction,
}: {
  readonly isProduction: boolean;
}): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' https: data:",
    "style-src 'self' 'unsafe-inline' https:",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "connect-src 'self'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function setupApiDocumentation({
  app,
  isProduction,
}: {
  readonly app: INestApplication;
  readonly isProduction: boolean;
}): void {
  const contentSecurityPolicy = scalarContentSecurityPolicy({ isProduction });
  const document = createApiDocument({ app });
  const httpAdapter = app.getHttpAdapter();

  httpAdapter.get(OPENAPI_JSON_PATH, (_request, response) => {
    response.json(document);
  });

  app.use(
    API_DOCUMENTATION_PATH,
    (_request: unknown, response: DocumentationResponse, next: () => void) => {
      response.setHeader("Content-Security-Policy", contentSecurityPolicy);
      next();
    },
    apiReference({
      pageTitle: "BTTF DVD Shop API",
      url: OPENAPI_JSON_PATH,
    }),
  );
}

export function createApiDocument({
  app,
}: {
  readonly app: INestApplication;
}): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle("BTTF DVD Shop API")
    .setDescription("Prices Back to the Future DVD carts.")
    .setVersion("0.1.0")
    .addTag("Health")
    .addTag("Cart")
    .build();

  return SwaggerModule.createDocument(app, config);
}

type DocumentationResponse = {
  setHeader(name: string, value: string): void;
};
