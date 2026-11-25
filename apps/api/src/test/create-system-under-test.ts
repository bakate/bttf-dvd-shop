import "reflect-metadata";

import { vi } from "vitest";

import { createApp } from "../app.factory";
import type { AppConfig } from "../config/app.config";
import { PriceCartUseCase } from "../modules/pricing/application/price-cart.use-case";
import {
  CART_CONTROLLER_PATH,
  CART_PRICE_PATH,
} from "../modules/pricing/presentation/cart-routes";
import { API_GLOBAL_PREFIX } from "../shared/presentation/api-routes";
import { REQUEST_ID_HEADER } from "../shared/presentation/request-id";

type HttpReply = {
  readonly statusCode: number;
  readonly body: unknown;
};

type ContentReply = HttpReply & {
  readonly mediaType: string | undefined;
};

type TracedReply = ContentReply & {
  readonly requestId: string | null;
};

type CrossOriginReply = {
  readonly allowedOrigin: string | null;
};

// nestjs-pino keeps the first app's log destination for the whole process, so every app in a test file shares this one.
const logLines: string[] = [];
const logDestination = {
  write: (line: string) => {
    logLines.push(line);
  },
};

type EnvironmentVariables = Partial<Record<keyof AppConfig, string>>;

export type SystemUnderTest = {
  checkHealth(): Promise<HttpReply>;
  checkHealthFromOrigin(origin: string): Promise<CrossOriginReply>;
  priceCart(body: unknown): Promise<ContentReply>;
  priceCartTraced(body: unknown): Promise<TracedReply>;
  givenPricingFailsWith(error: unknown): void;
  logs(): string;
  loggedRecords(): readonly unknown[];
  close(): Promise<void>;
};

export async function createSystemUnderTest({
  environment = {},
}: {
  readonly environment?: EnvironmentVariables;
} = {}): Promise<SystemUnderTest> {
  const restoreEnvironment = applyEnvironment(environment);
  const firstLogLine = logLines.length;
  const app = await createApp({ logDestination });
  await app.listen(0);
  const apiUrl = `${await app.getUrl()}/${API_GLOBAL_PREFIX}`;

  async function get(path: string): Promise<HttpReply> {
    const response = await fetch(`${apiUrl}${path}`);

    return { statusCode: response.status, body: await response.json() };
  }

  function appLogLines(): readonly string[] {
    return logLines.slice(firstLogLine);
  }

  async function postCart(body: unknown): Promise<TracedReply> {
    const response = await fetch(
      `${apiUrl}/${CART_CONTROLLER_PATH}/${CART_PRICE_PATH}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    return {
      statusCode: response.status,
      mediaType: response.headers.get("content-type")?.split(";")[0],
      requestId: response.headers.get(REQUEST_ID_HEADER),
      body: await response.json(),
    };
  }

  return {
    checkHealth: () => get("/health"),
    checkHealthFromOrigin: async (origin) => {
      const response = await fetch(`${apiUrl}/health`, {
        headers: { Origin: origin },
      });

      return {
        allowedOrigin: response.headers.get("access-control-allow-origin"),
      };
    },
    priceCart: async (body) => {
      const { requestId: _requestId, ...reply } = await postCart(body);

      return reply;
    },
    priceCartTraced: postCart,
    givenPricingFailsWith: (error) => {
      vi.spyOn(app.get(PriceCartUseCase), "execute").mockImplementation(() => {
        throw error;
      });
    },
    logs: () => appLogLines().join(""),
    loggedRecords: () => appLogLines().map((line): unknown => JSON.parse(line)),
    close: async () => {
      await app.close();
      restoreEnvironment();
    },
  };
}

function applyEnvironment(environment: EnvironmentVariables): () => void {
  const previous = { ...process.env };
  Object.assign(process.env, environment);

  return () => {
    process.env = previous;
  };
}
