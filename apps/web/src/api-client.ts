import { z } from "zod";

import type { CreateClientConfig } from "./generated/api/client.gen";

export const REQUEST_TIMEOUT_MS = 15_000;

export class RequestTimeoutError extends Error {
  override readonly name = "RequestTimeoutError";
}

const clientProblemSchema = z.object({
  type: z.string(),
  status: z.number().int().min(400).max(499),
});

export type ClientProblem = z.infer<typeof clientProblemSchema>;

export type RequestFailure =
  | { readonly kind: "client-problem"; readonly problem: ClientProblem }
  | { readonly kind: "timeout" }
  | { readonly kind: "unexpected" };

export type RequestFailureKind = RequestFailure["kind"];

export function classifyRequestError(error: unknown): RequestFailure {
  if (error instanceof RequestTimeoutError) {
    return { kind: "timeout" };
  }

  const problem = clientProblemSchema.safeParse(error);

  return problem.success
    ? { kind: "client-problem", problem: problem.data }
    : { kind: "unexpected" };
}

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    throw controller.signal.aborted ? new RequestTimeoutError() : error;
  } finally {
    clearTimeout(timeout);
  }
};

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  // Node's fetch, used by the screen tests, rejects relative URLs.
  baseUrl: window.location.origin,
  fetch: fetchWithTimeout,
});
