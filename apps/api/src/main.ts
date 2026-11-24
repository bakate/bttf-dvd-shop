import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { createApp, type TypedConfigService } from "./app.factory";
import { API_GLOBAL_PREFIX } from "./shared/presentation/api-routes";

async function bootstrap(): Promise<void> {
  const app = await createApp({ logger: true });
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
