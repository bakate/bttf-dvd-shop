import { HttpException, type HttpStatus } from "@nestjs/common";
import type { SchemaObject } from "@nestjs/swagger";

export const PROBLEM_JSON_MEDIA_TYPE = "application/problem+json";

export type ProblemDetails = {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
};

export type ProblemKind = Pick<ProblemDetails, "type" | "title">;

// RFC 9457: clients match on `type`, so a published type never changes.
export const requestProblems = {
  invalid: { type: "request/invalid", title: "The request is invalid." },
  notFound: {
    type: "request/not-found",
    title: "The resource does not exist.",
  },
  tooLarge: {
    type: "request/too-large",
    title: "The request body is too large.",
  },
  rateLimited: { type: "request/rate-limited", title: "Too many requests." },
  failed: { type: "request/failed", title: "The request failed." },
} as const satisfies Record<string, ProblemKind>;

export const internalProblem = {
  type: "server/internal",
  title: "Internal server error.",
} as const satisfies ProblemKind;

export class ProblemDetailsException extends HttpException {
  readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem, problem.status);
    this.problem = problem;
  }
}

export function problemDetailsOpenApiSchema({
  types,
  status,
}: {
  readonly types: readonly string[];
  readonly status: HttpStatus;
}) {
  return {
    type: "object",
    required: ["type", "title", "status", "detail"],
    properties: {
      type: {
        type: "string",
        enum: [...types],
        description: "Stable code of the problem, to match on.",
      },
      title: { type: "string", description: "English summary of the type." },
      status: { type: "integer", enum: [status] },
      detail: {
        type: "string",
        description: "English explanation of this occurrence, for debugging.",
      },
    },
  } as const satisfies SchemaObject;
}
