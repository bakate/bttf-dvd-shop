import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createSystemUnderTest,
  type SystemUnderTest,
} from "#src/test/create-system-under-test";
import { API_DOCUMENTATION_PATH } from "./api-routes";

const builtFrontendIndexHtml =
  '<!doctype html><html lang="fr"><title>BTTF</title></html>';

describe("Web app served by the API", () => {
  let app: SystemUnderTest;

  beforeAll(async () => {
    app = await createSystemUnderTest({ builtFrontendIndexHtml });
  });

  afterAll(async () => {
    await app.close();
  });

  it("Given a built frontend, when a browser opens the site root, then the API serves the frontend page", async () => {
    const page = await app.openPage("/");

    expect(page).toMatchObject({
      statusCode: 200,
      mediaType: "text/html",
      body: builtFrontendIndexHtml,
    });
  });

  it("Given a built frontend, when a browser opens the site root, then only the site's own scripts, styles, fonts, images and API may load", async () => {
    const page = await app.openPage("/");

    expect(page.contentSecurityPolicy).toEqual({
      "default-src": "'self'",
      "base-uri": "'self'",
      "form-action": "'self'",
      "frame-ancestors": "'none'",
      "object-src": "'none'",
      "script-src": "'self'",
      "script-src-attr": "'none'",
      "style-src": "'self' 'unsafe-inline'",
      "font-src": "'self'",
      "img-src": "'self'",
      "connect-src": "'self'",
    });
  });

  it("Given a built frontend, when a reader opens the API documentation, then the page may load the documentation scripts from their CDN", async () => {
    const page = await app.openPage(API_DOCUMENTATION_PATH);

    expect(page.contentSecurityPolicy["script-src"]).toContain(
      "https://cdn.jsdelivr.net",
    );
  });

  it("Given a built frontend, when a client checks the API health, then the API still answers it", async () => {
    const health = await app.checkHealth();

    expect(health).toEqual({ statusCode: 200, body: { status: "ok" } });
  });
});
