import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { destination } from "pino";

import { createApp, type TypedConfigService } from "./app.factory";
import { exitOnFatalError } from "./crash-only";
import { API_GLOBAL_PREFIX } from "./shared/presentation/api-routes";

async function bootstrap(): Promise<void> {
  const app = await createApp({ logDestination: destination() });
  exitOnFatalError(app);
  const port = app
    .get<TypedConfigService>(ConfigService)
    .get("PORT", { infer: true });

  await app.listen(port);

  Logger.log(
    `API listening on http://localhost:${port}/${API_GLOBAL_PREFIX}`,
    "Bootstrap",
  );
}

void bootstrap();
