import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createSystemUnderTest,
  type SystemUnderTest,
} from "../../../test/create-system-under-test";

describe("API health", () => {
  let api: SystemUnderTest;

  beforeAll(async () => {
    api = await createSystemUnderTest();
  });

  afterAll(async () => {
    await api.close();
  });

  it("Given the API is running, when a client checks its health, then it answers that it is up", async () => {
    const health = await api.checkHealth();

    expect(health).toEqual({ statusCode: 200, body: { status: "ok" } });
  });
});

describe("API cross-origin access", () => {
  const allowedOrigin = "https://shop.example";
  let api: SystemUnderTest;

  beforeAll(async () => {
    api = await createSystemUnderTest({
      environment: { CORS_ORIGIN: allowedOrigin },
    });
  });

  afterAll(async () => {
    await api.close();
  });

  it("Given the API allows an origin, when a browser from that origin checks health, then the API allows it", async () => {
    const reply = await api.checkHealthFromOrigin(allowedOrigin);

    expect(reply.allowedOrigin).toBe(allowedOrigin);
  });
});
