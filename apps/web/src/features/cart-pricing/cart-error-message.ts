import { z } from "zod";

import { messages } from "../../messages";

const { errors } = messages.cartPricing;

const problemSchema = z.object({ type: z.string() });

const messageByProblemType = new Map<string, string>(
  Object.entries(errors.byProblemType),
);

export function cartErrorMessage(error: unknown): string {
  const problem = problemSchema.safeParse(error);

  if (!problem.success) {
    return errors.fallback;
  }

  return messageByProblemType.get(problem.data.type) ?? errors.fallback;
}
