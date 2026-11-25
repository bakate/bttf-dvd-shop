import type { ClientProblem } from "../../api-client";
import { messages } from "../../messages";

const { errors } = messages.cartPricing;

const messageByProblemType = new Map<string, string>(
  Object.entries(errors.byProblemType),
);

export function cartErrorMessage(problem: ClientProblem): string {
  return messageByProblemType.get(problem.type) ?? errors.fallback;
}
