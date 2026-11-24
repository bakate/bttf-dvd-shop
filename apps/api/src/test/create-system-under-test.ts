import "reflect-metadata";

import { createApp } from "../app.factory";
import type { AppConfig } from "../config/app.config";
import { API_GLOBAL_PREFIX } from "../shared/presentation/api-routes";

type HttpReply = {
  readonly statusCode: number;
  readonly body: unknown;
};

type CrossOriginReply = {
  readonly allowedOrigin: string | null;
};

type EnvironmentVariables = Partial<Record<keyof AppConfig, string>>;

export type SystemUnderTest = {
  checkHealth(): Promise<HttpReply>;
  checkHealthFromOrigin(origin: string): Promise<CrossOriginReply>;
  close(): Promise<void>;
};

export async function createSystemUnderTest({
  environment = {},
}: {
  readonly environment?: EnvironmentVariables;
} = {}): Promise<SystemUnderTest> {
  const restoreEnvironment = applyEnvironment(environment);
  const app = await createApp({ logger: false });
  await app.listen(0);
  const apiUrl = `${await app.getUrl()}/${API_GLOBAL_PREFIX}`;

  async function get(path: string): Promise<HttpReply> {
    const response = await fetch(`${apiUrl}${path}`);

    return { statusCode: response.status, body: await response.json() };
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
