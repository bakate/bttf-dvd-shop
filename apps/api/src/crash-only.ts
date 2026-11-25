import type { INestApplication } from "@nestjs/common";
import { Logger } from "nestjs-pino";

const SHUTDOWN_TIMEOUT_MS = 10_000;
const CRASH_EXIT_CODE = 1;

export function exitOnFatalError(app: INestApplication): void {
  const logger = app.get(Logger);
  let isCrashing = false;

  function crash(error: unknown): void {
    logger.fatal(error, "Process");

    if (isCrashing) {
      return;
    }

    isCrashing = true;
    setTimeout(
      () => process.exit(CRASH_EXIT_CODE),
      SHUTDOWN_TIMEOUT_MS,
    ).unref();
    void app.close().finally(() => process.exit(CRASH_EXIT_CODE));
  }

  process.on("uncaughtException", crash);
  process.on("unhandledRejection", crash);
}
