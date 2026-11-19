import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ApiKeyGuard } from "./common/guards/api-key.guard.js";
import { RolesGuard } from "./common/guards/roles.guard.js";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor.js";
import { TimeoutInterceptor } from "./common/interceptors/timeout.interceptor.js";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware.js";
import { validateEnv } from "./config/validate-env.js";
import { DebugModule } from "./debug/debug.module.js";
import { DishesModule } from "./dishes/dishes.module.js";
import { OrdersModule } from "./orders/orders.module.js";
import { RestaurantsModule } from "./restaurants/restaurants.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    OrdersModule,
    RestaurantsModule,
    DishesModule,
    ...(process.env.NODE_ENV === "production" ? [] : [DebugModule]),
  ],
  providers: [
    // APP_* tokens build these through the container, so they can inject services.
    // (app.useGlobalGuards(new X()) cannot: the container never sees it.)
    // Order matters: ApiKeyGuard must run first, because it is what sets request.user.
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Registered first = outermost: Logging wraps Timeout, so its duration is what the client waited.
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
