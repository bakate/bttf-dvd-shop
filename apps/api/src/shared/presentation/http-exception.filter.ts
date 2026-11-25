import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { z } from "zod";

import {
  internalProblem,
  PROBLEM_JSON_MEDIA_TYPE,
  type ProblemDetails,
  ProblemDetailsException,
  type ProblemKind,
  requestProblems,
} from "./problem-details";

const requestProblemByStatus = new Map<number, ProblemKind>([
  [HttpStatus.BAD_REQUEST, requestProblems.invalid],
  [HttpStatus.NOT_FOUND, requestProblems.notFound],
  [HttpStatus.PAYLOAD_TOO_LARGE, requestProblems.tooLarge],
  [HttpStatus.TOO_MANY_REQUESTS, requestProblems.rateLimited],
]);

// body-parser rejects with http-errors objects, which Nest does not wrap; `expose` marks a client error safe to report.
const exposedClientErrorSchema = z.object({
  status: z.number().int().min(400).max(499),
  expose: z.literal(true),
});

type ClientError = {
  readonly status: number;
  readonly message: string | undefined;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    const problem = toProblemDetails(exception);

    if (problem.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    }

    response.status(problem.status).type(PROBLEM_JSON_MEDIA_TYPE).json(problem);
  }
}

type HttpResponse = {
  status(statusCode: number): HttpResponse;
  type(mediaType: string): HttpResponse;
  json(body: ProblemDetails): void;
};

function toProblemDetails(exception: unknown): ProblemDetails {
  if (exception instanceof ProblemDetailsException) {
    return exception.problem;
  }

  const clientError = toClientError(exception);

  if (clientError === undefined) {
    // Security: an unexpected error's message and stack never reach the response.
    return {
      ...internalProblem,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: "An unexpected error occurred.",
    };
  }

  const kind =
    requestProblemByStatus.get(clientError.status) ?? requestProblems.failed;

  return {
    ...kind,
    status: clientError.status,
    detail: clientError.message ?? kind.title,
  };
}

function toClientError(exception: unknown): ClientError | undefined {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();

    return status < HttpStatus.INTERNAL_SERVER_ERROR
      ? { status, message: exception.message }
      : undefined;
  }

  const exposedClientError = exposedClientErrorSchema.safeParse(exception);

  // Privacy: a parser error message can quote the request body, so it never reaches the response.
  return exposedClientError.success
    ? { status: exposedClientError.data.status, message: undefined }
    : undefined;
}
