import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";

import type { AppConfig } from "./config/app.config";
import { AppModule } from "./modules/app.module";
import { setupApiDocumentation } from "./shared/presentation/api-documentation";
import { API_GLOBAL_PREFIX } from "./shared/presentation/api-routes";

export type TypedConfigService = ConfigService<AppConfig, true>;

export const REQUEST_BODY_LIMIT_BYTES = 16 * 1024;

export async function createApp({
  logger,
}: {
  readonly logger: boolean;
}): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    ...(logger ? {} : { logger: false }),
  });
  const config = app.get<TypedConfigService>(ConfigService);

  app.useBodyParser("json", { limit: REQUEST_BODY_LIMIT_BYTES });

  app.use(helmet());
  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  app.enableShutdownHooks();
  setupApiDocumentation({
    app,
    isProduction: config.get("NODE_ENV", { infer: true }) === "production",
  });

  const allowedOrigin = config.get("CORS_ORIGIN", { infer: true });

  if (allowedOrigin !== undefined) {
    app.enableCors({ origin: allowedOrigin });
  }

  return app;
}
