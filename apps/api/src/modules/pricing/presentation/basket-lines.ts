import { type ZodError, z } from "zod";

import { failure, type Result, success } from "#src/shared/result";

export const MAX_BASKET_LINES = 500;
export const MAX_BASKET_LINE_LENGTH = 200;

export const TOO_MANY_LINES_ERROR_CODE = "cart/too-many-lines";
export const LINE_TOO_LONG_ERROR_CODE = "cart/line-too-long";

const LINE_BREAK = /\r\n|\r|\n/;

const basketLinesSchema = z
  .array(z.string().max(MAX_BASKET_LINE_LENGTH))
  .max(MAX_BASKET_LINES);

export type BasketError = {
  readonly code:
    | typeof TOO_MANY_LINES_ERROR_CODE
    | typeof LINE_TOO_LONG_ERROR_CODE;
  readonly message: string;
};

function isFilled(line: string): boolean {
  return line.trim() !== "";
}

export function readBasketLines(
  basket: string,
): Result<readonly string[], BasketError> {
  const lines = basket.split(LINE_BREAK).filter(isFilled);
  const parsedLines = basketLinesSchema.safeParse(lines);

  if (!parsedLines.success) {
    return failure({ error: toBasketError(parsedLines.error) });
  }

  return success({ value: parsedLines.data });
}

function isAboutOneLine(error: ZodError): boolean {
  return (error.issues[0]?.path.length ?? 0) > 0;
}

function toBasketError(error: ZodError): BasketError {
  if (isAboutOneLine(error)) {
    return {
      code: LINE_TOO_LONG_ERROR_CODE,
      message: `A line has more than ${MAX_BASKET_LINE_LENGTH} characters.`,
    };
  }

  return {
    code: TOO_MANY_LINES_ERROR_CODE,
    message: `The basket has more than ${MAX_BASKET_LINES} filled lines.`,
  };
}
