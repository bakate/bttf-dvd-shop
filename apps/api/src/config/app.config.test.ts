import { describe, expect, it } from "vitest";

import { validateAppConfig } from "./app.config";

describe("validateAppConfig", () => {
  it("Given no optional variable is set, when the configuration is validated, then the defaults apply", () => {
    const config = validateAppConfig({});

    expect(config).toEqual({
      NODE_ENV: "development",
      PORT: 3000,
      CORS_ORIGIN: undefined,
      API_RATE_LIMIT_TTL_MS: 60_000,
      API_RATE_LIMIT_LIMIT: 100,
    });
  });

  it("Given numeric variables set as strings, when the configuration is validated, then they are read as numbers", () => {
    const config = validateAppConfig({
      PORT: "3100",
      API_RATE_LIMIT_TTL_MS: "120000",
      API_RATE_LIMIT_LIMIT: "50",
    });

    expect(config.PORT).toBe(3100);
    expect(config.API_RATE_LIMIT_TTL_MS).toBe(120_000);
    expect(config.API_RATE_LIMIT_LIMIT).toBe(50);
  });

  it("Given a port that is not a number, when the configuration is validated, then startup fails", () => {
    expect(() =>
      validateAppConfig({
        PORT: "not-a-port",
      }),
    ).toThrow("Invalid API environment configuration");
  });
});
