import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { type AppConfig, validateAppConfig } from "../config/app.config";
import { HttpExceptionFilter } from "../shared/presentation/http-exception.filter";
import { HealthController } from "./health/presentation/health.controller";
import { PricingModule } from "./pricing/pricing.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateAppConfig,
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
})
export class AppModule {}
