import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { AuthModule } from "./auth/auth.module.js";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "./common/guards/roles.guard.js";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor.js";
import { TimeoutInterceptor } from "./common/interceptors/timeout.interceptor.js";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware.js";
import { loggerConfig } from "./config/logger.config.js";
import { validateEnv } from "./config/validate-env.js";
import { UsersModule } from "./users/users.module.js";
import { DebugModule } from "./debug/debug.module.js";
import { DishesModule } from "./dishes/dishes.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { RestaurantsModule } from "./restaurants/restaurants.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // level from LOG_LEVEL, pretty only when NODE_ENV=development; see config/logger.config.ts
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => loggerConfig(config),
    }),
    UsersModule,
    AuthModule,
    OrdersModule,
    RestaurantsModule,
    DishesModule,
    ...(process.env.NODE_ENV === "production" ? [] : [DebugModule]),
  ],
  providers: [
    // APP_* tokens build these through the container, so they can inject services.
    // Order matters: JwtAuthGuard must run first, because it is what sets request.user.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Stage 1: before routing. Declaration order is run order.
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
