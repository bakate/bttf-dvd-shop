import { randomUUID } from "node:crypto";

import { type DynamicModule, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import type { DestinationStream } from "pino";

import { type AppConfig, validateAppConfig } from "../config/app.config";
import { HttpExceptionFilter } from "../shared/presentation/http-exception.filter";
import { REQUEST_ID_HEADER } from "../shared/presentation/request-id";
import { HealthController } from "./health/presentation/health.controller";
import { PricingModule } from "./pricing/pricing.module";

@Module({})
class AppModule {}

export function appModule({
  logDestination,
}: {
  readonly logDestination: DestinationStream;
}): DynamicModule {
  return {
    module: AppModule,
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        validate: validateAppConfig,
      }),
      LoggerModule.forRoot({
        pinoHttp: [
          {
            genReqId: (_request, response) => {
              const requestId = randomUUID();
              response.setHeader(REQUEST_ID_HEADER, requestId);

              return requestId;
            },
            // Privacy: an allowlist keeps headers, cookies and the basket out of the logs.
            serializers: {
              req: ({ id, method, url }) => ({ id, method, url }),
              res: ({ statusCode }) => ({ statusCode }),
            },
          },
          logDestination,
        ],
      }),
      ThrottlerModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (config: ConfigService<AppConfig, true>) => [
          {
            ttl: config.get("API_RATE_LIMIT_TTL_MS", { infer: true }),
            limit: config.get("API_RATE_LIMIT_LIMIT", { infer: true }),
          },
        ],
      }),
      PricingModule,
    ],
    controllers: [HealthController],
    providers: [
      {
        provide: APP_FILTER,
        useClass: HttpExceptionFilter,
      },
      {
        provide: APP_GUARD,
        useClass: ThrottlerGuard,
      },
    ],
  };
}
