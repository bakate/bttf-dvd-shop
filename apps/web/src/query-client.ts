import { MutationCache, QueryClient } from "@tanstack/react-query";

import { classifyRequestError, type RequestFailureKind } from "./api-client";
import { messages } from "./messages";
import { notifyError } from "./notify-error";
import { reportError } from "./report-error";

const globalHandlingByFailureKind = {
  "client-problem": { report: false, notify: false },
  timeout: { report: true, notify: false },
  unexpected: { report: true, notify: true },
} as const satisfies Record<
  RequestFailureKind,
  { readonly report: boolean; readonly notify: boolean }
>;

function handleMutationError(error: unknown): void {
  const handling =
    globalHandlingByFailureKind[classifyRequestError(error).kind];

  if (handling.report) {
    reportError(error);
  }

  if (handling.notify) {
    notifyError(messages.errors.unexpected);
  }
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({ onError: handleMutationError }),
    defaultOptions: {
      mutations: { retry: false },
    },
  });
}
