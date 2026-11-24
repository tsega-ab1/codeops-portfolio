#!/usr/bin/env bash
# Day 62 - Authorization & protected routes, on top of Day 61.
# Run it from INSIDE day62/addis-eats-api/ (a copy of day61/addis-eats-api):   bash day62-authorization.sh
set -e
[ -f src/auth/auth.module.ts ] && [ -f src/orders/orders.service.ts ] || { echo "Run this inside day62/addis-eats-api (a copy of Day 61)."; exit 1; }
mkdir -p src/common/policies src/common/guards src/common/decorators

# ---------------------------------------------------------------- 1. four roles, restaurantId on the user
cat > src/common/auth/auth.types.ts << 'EOF'
// A real array AND a type (Day 53): the array lets a validator check a value at runtime
export const ROLES = ["customer", "courier", "restaurant", "staff"] as const;
export type Role = (typeof ROLES)[number];

// What the JWT strategy puts on the request (req.user). Guards and policies only ever read this.
export interface AuthenticatedUser {
  id: number;
  email: string;
  roles: Role[];
}

// Just the parts of the HTTP request the guards use, so we need no `any`
export interface AuthRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
}
EOF

node - << 'NODE'
const fs = require("fs");
const edit = (f, fn) => { const t = fs.readFileSync(f, "utf8"); const r = fn(t); fs.writeFileSync(f, r); console.log(r === t ? "already " + f : "edited  " + f); };

// the user record: restaurantId for the restaurant role
edit("src/users/user.types.ts", (t) => t.includes("restaurantId") ? t :
  t.replace("  roles: Role[];\n  refreshHash", "  roles: Role[];\n  restaurantId?: number; // only for the restaurant role: the one menu it may manage\n  refreshHash"));

edit("src/users/users.repository.ts", (t) => t.replace('Pick<User, "email" | "passwordHash" | "roles">', 'Pick<User, "email" | "passwordHash" | "roles" | "restaurantId">'));

// the seed service: SEQUENTIAL, so user ids are the same on every start
edit("src/users/users.service.ts", (t) => {
  if (t.includes("for (const seed of SEED_USERS)")) return t;
  return t
    .replace(/    await Promise\.all\(\n      SEED_USERS\.map\(async \(seed\) =>\n        this\.repo\.create\(\{\n          email: seed\.email,\n          roles: seed\.roles,\n          passwordHash: await argon2\.hash\(password\), \/\/ each user gets its own salt\n        \}\),\n      \),\n    \);/,
`    // One at a time, in order: Promise.all would let whichever hash finishes first take the next id,
    // and the seed orders point at these ids (SEED_USER_ID), so they must be the same on every start.
    for (const seed of SEED_USERS) {
      await this.repo.create({
        email: seed.email,
        roles: seed.roles,
        restaurantId: seed.restaurantId,
        passwordHash: await argon2.hash(password), // each user gets its own salt
      });
    }`)
    .replace("The three development users.", "The five development users, one per role plus a second customer.");
});

// orders know who placed them and who delivers them
edit("src/orders/order.types.ts", (t) => t.includes("customerId") ? t :
  t.replace("  customer: string;\n", "  customer: string; // the name on the order, for display\n  customerId?: number; // the USER who placed it: what ownership is decided on\n  courierId?: number; // the courier user it is assigned to, once there is one\n"));

edit("src/orders/dto/order.response.ts", (t) => t.includes("customerId") ? t :
  t.replace('  @ApiProperty({ enum: AREAS, example: "Bole", description: "The delivery area." })',
`  @ApiPropertyOptional({ example: 2, description: "The user who placed the order." })
  customerId?: number;

  @ApiPropertyOptional({ example: 4, description: "The courier user the order is assigned to." })
  courierId?: number;

  @ApiProperty({ enum: AREAS, example: "Bole", description: "The delivery area." })`));

edit("src/auth/dto/user.response.ts", (t) => t.replace('enum: ["staff", "customer"]', 'enum: ["customer", "courier", "restaurant", "staff"]'));
NODE

cat > src/users/users.seed.ts << 'EOF'
import type { Role } from "../common/auth/auth.types.js";

// Development accounts, created at startup (never in production), one per role plus a second customer.
// Their password is SEED_PASSWORD from .env, so no password and no hash is ever committed.
// The ORDER matters: ids are handed out 1, 2, 3, ... and the seed orders refer to them.
export const SEED_USERS: ReadonlyArray<{ email: string; roles: Role[]; restaurantId?: number }> = [
  { email: "staff@example.et", roles: ["staff"] },
  { email: "almaz@example.et", roles: ["customer"] },
  { email: "dawit@example.et", roles: ["customer"] },
  { email: "kebede@example.et", roles: ["courier"] },
  { email: "abyssinia@example.et", roles: ["restaurant"], restaurantId: 1 },
];

// The ids those five get, so orders.seed.ts can say who owns what without magic numbers
export const SEED_USER_ID = { staff: 1, almaz: 2, dawit: 3, kebede: 4, abyssinia: 5 } as const;
EOF

# ---------------------------------------------------------------- 2. ownership in the seed orders
node - << 'NODE'
const fs = require("fs");
let t = fs.readFileSync("src/orders/orders.seed.ts", "utf8");
if (!t.includes("OWNERSHIP")) {
  t = t.replace('import type { Area, Dish, Order, OrderStatus } from "./order.types.js";', 'import { SEED_USER_ID as U } from "../users/users.seed.js";\nimport type { Area, Dish, Order, OrderStatus } from "./order.types.js";');
  // two customers each get three orders: give those orders their owner's name
  t = t.replace('makeOrder(4, "Henok Girma"', 'makeOrder(4, "Almaz Bekele"').replace('makeOrder(8, "Yonas Mekonnen"', 'makeOrder(8, "Almaz Bekele"')
       .replace('makeOrder(9, "Hana Tadesse"', 'makeOrder(9, "Dawit Tesfaye"').replace('makeOrder(12, "Kidus Abera"', 'makeOrder(12, "Dawit Tesfaye"');
  t = t.replace("export const SEED_ORDERS: Order[] = [", "const BASE_ORDERS: Order[] = [");
  t += `
// Day 62: who owns what. Almaz and Dawit are customers with three orders each, Kebede is a courier with
// four deliveries. The other seven orders belong to nobody who has an account, so every user is a stranger to them.
//   almaz  : 1 DELIVERED, 4 PREPARING, 8 PENDING          (reads 3)
//   dawit  : 2 PENDING, 9 ON_THE_WAY, 12 PENDING          (reads 3)
//   kebede : 1, 3, 4 and 9, assigned to him               (reads 4)
const OWNERSHIP: Record<number, { customerId?: number; courierId?: number }> = {
  1: { customerId: U.almaz, courierId: U.kebede },
  2: { customerId: U.dawit },
  3: { courierId: U.kebede },
  4: { customerId: U.almaz, courierId: U.kebede },
  8: { customerId: U.almaz },
  9: { customerId: U.dawit, courierId: U.kebede },
  12: { customerId: U.dawit },
};

export const SEED_ORDERS: Order[] = BASE_ORDERS.map((order) => ({ ...order, ...OWNERSHIP[order.id] }));
`;
  fs.writeFileSync("src/orders/orders.seed.ts", t); console.log("edited  src/orders/orders.seed.ts");
}
NODE

# ---------------------------------------------------------------- 3. the policy
cat > src/common/policies/order.policy.ts << 'EOF'
import { Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth.types.js";
import type { Order } from "../../orders/order.types.js";

export const ORDER_ACTIONS = ["read", "cancel", "updateStatus"] as const;
export type OrderAction = (typeof ORDER_ACTIONS)[number];

// A policy is a function of THREE things: the user, the action, and the resource.
// It returns a boolean and throws nothing: the CALLER decides the status code, so a guard, a service,
// a WebSocket gateway and a unit test can all use it. Read it against the rules table:
//   staff reads/cancels anything                      -> the bypass at the top
//   a customer reads their own order                  -> "read"
//   a customer cancels their own order, only PENDING  -> "cancel"
//   a courier updates the status of THEIR orders      -> "updateStatus"
@Injectable()
export class OrderPolicy {
  can(user: AuthenticatedUser, action: OrderAction, order: Order): boolean {
    if (user.roles.includes("staff")) return true;

    switch (action) {
      case "read":
        return order.customerId === user.id || order.courierId === user.id;

      case "cancel":
        return order.customerId === user.id && order.status === "PENDING";

      case "updateStatus":
        return order.courierId === user.id && (order.status === "PREPARING" || order.status === "ON_THE_WAY");

      default: {
        // Add "refund" to ORDER_ACTIONS and THIS LINE stops compiling until somebody decides who may refund.
        // It returns false, never the value: if a bad action ever reaches here at runtime, the answer is no.
        const unreachable: never = action;
        void unreachable;
        return false;
      }
    }
  }
}
EOF

# ---------------------------------------------------------------- 4. the decorators and the guard
cat > src/common/decorators/current-order.decorator.ts << 'EOF'
import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import type { Order } from "../../orders/order.types.js";

// @CurrentOrder() order: Order  ->  the order OrderPolicyGuard already loaded and checked.
// The guard has paid for the lookup, so the handler does not repeat it.
export const CurrentOrder = createParamDecorator((_data: unknown, context: ExecutionContext): Order => {
  const order = context.switchToHttp().getRequest<{ order?: Order }>().order;
  if (!order) throw new Error("@CurrentOrder() needs @CheckPolicy() on the same route");
  return order;
});
EOF

cat > src/common/decorators/check-policy.decorator.ts << 'EOF'
import { SetMetadata, UseGuards, applyDecorators } from "@nestjs/common";
import { OrderPolicyGuard } from "../guards/order-policy.guard.js";
import type { OrderAction } from "../policies/order.policy.js";

export const POLICY_KEY = "orderPolicyAction";

// One decorator does both jobs: it WRITES the action as metadata (Day 59's pattern) and attaches the guard
// that READS it. A route marked @CheckPolicy("cancel") cannot forget its guard.
export const CheckPolicy = (action: OrderAction) =>
  applyDecorators(SetMetadata(POLICY_KEY, action), UseGuards(OrderPolicyGuard));
EOF

cat > src/common/guards/order-policy.guard.ts << 'EOF'
import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import type { AuthRequest } from "../auth/auth.types.js";
import { POLICY_KEY } from "../decorators/check-policy.decorator.js";
import { OrderNotFoundError } from "../../orders/order.errors.js";
import type { Order } from "../../orders/order.types.js";
import { OrdersService } from "../../orders/orders.service.js";
import { OrderPolicy } from "../policies/order.policy.js";
import type { OrderAction } from "../policies/order.policy.js";

type OrderRequest = AuthRequest & { params: Record<string, string>; order?: Order };

const VERB: Record<OrderAction, string> = {
  read: "read",
  cancel: "cancel",
  updateStatus: "change the status of",
};

// Runs AFTER JwtAuthGuard and RolesGuard (global guards go first), so req.user is real and the role is right.
// It loads the order, asks the policy, and decides what to SAY about a refusal:
//   the caller may not even SEE the order -> 404, the same words as a missing one (existence is a secret)
//   the caller can see it but may not do THIS to it -> 403 (nothing is being hidden)
@Injectable()
export class OrderPolicyGuard implements CanActivate {
  constructor(
    @InjectPinoLogger(OrderPolicyGuard.name) private readonly logger: PinoLogger,
    private readonly reflector: Reflector,
    private readonly orders: OrdersService,
    private readonly policy: OrderPolicy,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const action = this.reflector.get<OrderAction | undefined>(POLICY_KEY, context.getHandler());
    if (!action) return true;

    const req = context.switchToHttp().getRequest<OrderRequest>();
    const user = req.user;
    if (!user) return false; // cannot happen behind JwtAuthGuard; refuse rather than assume

    const id = Number(req.params.id);
    // "boom" is not an order id: the same 400 and the same words ParseIntPipe used before today
    if (!Number.isInteger(id)) throw new BadRequestException("Validation failed (numeric string is expected)");

    let order: Order;
    try {
      order = this.orders.find(id);
    } catch (error) {
      // Deleting something that is already gone is still a 204 (Day 58): keep that promise for staff
      if (error instanceof OrderNotFoundError && action === "cancel" && user.roles.includes("staff")) return true;
      throw error; // a missing order is a 404 for everybody else
    }

    if (!this.policy.can(user, "read", order)) {
      // THE TRUTH goes in the log; the caller is told only "not found"
      this.logger.warn({ userId: user.id, orderId: id, action, answered: 404 }, "access refused: order hidden from caller");
      throw new OrderNotFoundError(id);
    }
    if (!this.policy.can(user, action, order)) {
      this.logger.warn({ userId: user.id, orderId: id, action, answered: 403 }, "access refused: action not allowed");
      throw new ForbiddenException(`You are not allowed to ${VERB[action]} order ${id}`);
    }

    req.order = order; // already loaded: the handler must not load it twice
    return true;
  }
}
EOF

# ---------------------------------------------------------------- 5. wire it into the orders module, service and controllers
node - << 'NODE'
const fs = require("fs");
const edit = (f, fn) => { const t = fs.readFileSync(f, "utf8"); const r = fn(t); fs.writeFileSync(f, r); console.log(r === t ? "already " + f : "edited  " + f); };

edit("src/orders/orders.module.ts", (t) => t.includes("OrderPolicy") ? t : t
  .replace('import { DeliveryFeesController }', 'import { OrderPolicy } from "../common/policies/order.policy.js";\nimport { DeliveryFeesController }')
  .replace("    OrdersService,\n", "    OrdersService,\n    OrderPolicy, // the guard on the routes needs it in THIS module\n"));

edit("src/orders/orders.service.ts", (t) => {
  if (t.includes("OrderPolicy")) return t;
  return t
    .replace('import { paginate', 'import type { AuthenticatedUser } from "../common/auth/auth.types.js";\nimport { OrderPolicy } from "../common/policies/order.policy.js";\nimport { paginate')
    .replace("    private readonly dishes: DishesService,\n  ) {}", "    private readonly dishes: DishesService,\n    private readonly policy: OrderPolicy,\n  ) {}")
    .replace(`  findAll(query: FindOrdersQuery): Page<Partial<Order>> {
    return this.page(this.repository.all(), query);
  }`, `  // A guard cannot see a LIST, so the collection is filtered here: a caller gets only the orders the policy
  // lets them read. Staff read everything, so for staff this is the whole table.
  findAll(query: FindOrdersQuery, user: AuthenticatedUser): Page<Partial<Order>> {
    return this.page(this.visibleTo(user, this.repository.all()), query);
  }`)
    .replace(`  findByRestaurant(
    restaurantId: number,
    query: FindOrdersQuery,
  ): Page<Partial<Order>> {`, `  findByRestaurant(
    restaurantId: number,
    query: FindOrdersQuery,
    user: AuthenticatedUser,
  ): Page<Partial<Order>> {`)
    .replace(`    const rows = this.repository
      .all()
      .filter((o) => o.restaurantId === restaurantId);
    return this.page(rows, query);`, `    const rows = this.visibleTo(
      user,
      this.repository.all().filter((o) => o.restaurantId === restaurantId),
    );
    return this.page(rows, query);`)
    .replace("  create(dto: CreateOrderDto): Order {", "  create(dto: CreateOrderDto, user: AuthenticatedUser): Order {")
    .replace("      customer: dto.customer,\n      area: dto.area,", "      customer: dto.customer,\n      customerId: user.id, // ownership comes from the TOKEN, never from the request body\n      area: dto.area,")
    .replace("  // Record<Area, number> means a missing area is a build error", `  private visibleTo(user: AuthenticatedUser, rows: Order[]): Order[] {
    return rows.filter((order) => this.policy.can(user, "read", order));
  }

  // Record<Area, number> means a missing area is a build error`);
});

edit("src/orders/restaurant-orders.controller.ts", (t) => t.includes("CurrentUser") ? t : t
  .replace('import type { Page }', 'import type { AuthenticatedUser } from "../common/auth/auth.types.js";\nimport { CurrentUser } from "../common/decorators/current-user.decorator.js";\nimport type { Page }')
  .replace("    @Query() query: FindOrdersQuery,\n  ): Page<Partial<Order>> {\n    return this.orders.findByRestaurant(restaurantId, query);", "    @Query() query: FindOrdersQuery,\n    @CurrentUser() user: AuthenticatedUser,\n  ): Page<Partial<Order>> {\n    return this.orders.findByRestaurant(restaurantId, query, user);")
  .replace('description: "Takes the same filters, sorting, paging and `fields` as the general order list. A restaurant that does not exist is a 404, never an empty page.",', 'description: "Takes the same filters, sorting, paging and `fields` as the general order list, and shows only the orders the caller may read. A restaurant that does not exist is a 404, never an empty page.",')
  .replace("@ApiTags(", '@ApiBearerAuth("bearer")\n@ApiTags(')
  .replace('import { ApiOperation, ApiTags }', 'import { ApiBearerAuth, ApiOperation, ApiTags }')
  .replace("    404: \"No restaurant has that id.\",", "    401: \"Missing, invalid or expired access token.\",\n    404: \"No restaurant has that id.\","));

edit("src/orders/orders.controller.ts", (t) => {
  if (t.includes("CheckPolicy")) return t;
  return t
    .replace('import { Roles } from', 'import type { AuthenticatedUser } from "../common/auth/auth.types.js";\nimport { CheckPolicy } from "../common/decorators/check-policy.decorator.js";\nimport { CurrentOrder } from "../common/decorators/current-order.decorator.js";\nimport { CurrentUser } from "../common/decorators/current-user.decorator.js";\nimport { Roles } from')
    // GET /orders: filtered by the caller
    .replace('  @ApiErrors({ 400: "A query parameter is not allowed: limit over 50, an unknown status, area, sort field or field name." })\n  findAll(@Query() query: FindOrdersQuery): Page<Partial<Order>> {\n    return this.orders.findAll(query);',
             '  @ApiErrors({\n    400: "A query parameter is not allowed: limit over 50, an unknown status, area, sort field or field name.",\n    401: "Missing, invalid or expired access token.",\n  })\n  findAll(@Query() query: FindOrdersQuery, @CurrentUser() user: AuthenticatedUser): Page<Partial<Order>> {\n    return this.orders.findAll(query, user);')
    .replace('summary: "List orders, filtered, sorted and paged",\n    description:\n      "Filter by status', 'summary: "List the orders you may read, filtered, sorted and paged",\n    description:\n      "Staff see every order; a customer sees the orders they placed; a courier sees the orders assigned to them. Filter by status')
    // GET /orders/:id
    .replace('  @Get(":id")\n  @ApiOperation({ summary: "Get one order by id" })\n  @ApiOkResponse({ type: OrderResponse })\n  @ApiErrors({ 400: "The id is not a whole number.", 404: "No order has that id." })\n  findOne(@Param("id", ParseIntPipe) id: number): Order {\n    return this.orders.find(id);\n  }',
             '  @Get(":id")\n  @CheckPolicy("read") // the guard loads the order and decides who may see it\n  @ApiOperation({ summary: "Get one order by id" })\n  @ApiOkResponse({ type: OrderResponse })\n  @ApiErrors({\n    400: "The id is not a whole number.",\n    401: "Missing, invalid or expired access token.",\n    404: "No order has that id, or it is not yours to see. The two answers are identical on purpose.",\n  })\n  findOne(@Param("id", ParseIntPipe) _id: number, @CurrentOrder() order: Order): Order {\n    return order; // already loaded and checked by the guard\n  }')
    // POST /orders
    .replace("  create(@Body() dto: CreateOrderDto): Order {\n    return this.orders.create(dto);", "  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthenticatedUser): Order {\n    return this.orders.create(dto, user);")
    .replace('    400: "Validation failed: a field is missing or malformed, an undeclared field was sent (including totalSantim), lines is empty, or paymentMethod is TELEBIRR without a phone.",\n    404: "The restaurant does not exist.",', '    400: "Validation failed: a field is missing or malformed, an undeclared field was sent (including totalSantim), lines is empty, or paymentMethod is TELEBIRR without a phone.",\n    401: "Missing, invalid or expired access token.",\n    404: "The restaurant does not exist.",')
    .replace('"Send the lines, not a total: the server prices the order from the menu. "', '"Send the lines, not a total: the server prices the order from the menu, and records you as its owner. "')
    // PATCH status: couriers too, but only THEIR orders (the policy)
    .replace('  @Roles("staff") // customers place orders; only staff move them along\n  @ApiBearerAuth("bearer")\n  @ApiOperation({\n    summary: "Move an order to its next status (staff only)",',
             '  @Roles("courier", "staff") // the ROLE gate: customers and restaurants stop here\n  @CheckPolicy("updateStatus") // the POLICY gate: a courier only for an order assigned to them\n  @ApiBearerAuth("bearer")\n  @ApiOperation({\n    summary: "Move an order to its next status (staff, or the courier it is assigned to)",')
    .replace('    403: "The key is wrong, or it belongs to a caller who is not staff.",\n    404: "No order has that id.",\n    409:', '    403: "The caller is not staff or a courier, or the order is visible to them but not theirs to move or in a state they may not move it from.",\n    404: "No order has that id, or it is not yours to see.",\n    409:')
    .replace("  updateStatus(\n    @Param(\"id\", ParseIntPipe) id: number,\n    @Body() dto: UpdateStatusDto,\n  ): Order {\n    return this.orders.updateStatus(id, dto.status);", "  updateStatus(\n    @Param(\"id\", ParseIntPipe) _id: number,\n    @Body() dto: UpdateStatusDto,\n    @CurrentOrder() order: Order,\n  ): Order {\n    return this.orders.updateStatus(order.id, dto.status);")
    // DELETE: owner while PENDING, or staff (no @Roles: the policy decides)
    .replace('  @Delete(":id")\n  @Roles("staff")\n  @ApiBearerAuth("bearer")', '  @Delete(":id")\n  @CheckPolicy("cancel") // staff always; a customer only for their own order, only while it is PENDING\n  @ApiBearerAuth("bearer")')
    .replace('summary: "Cancel (delete) an order (staff only)",\n    description: "Idempotent: deleting an order that is already gone, or never existed, is still a 204.",', 'summary: "Cancel (delete) an order (staff, or its owner while it is PENDING)",\n    description: "Idempotent for staff: deleting an order that is already gone, or never existed, is still a 204.",')
    .replace('    403: "The key is wrong, or it belongs to a caller who is not staff.",\n  })\n  cancel', '    403: "The order is yours to see, but not to cancel: it is no longer PENDING, or you are its courier.",\n    404: "No order has that id, or it is not yours to see.",\n  })\n  cancel');
});

// the Day 59 Roles import is still used by PATCH; make sure nothing is left unused
NODE

# ---------------------------------------------------------------- 6. jest can resolve our ".js" import paths
node - << 'NODE'
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.jest.moduleNameMapper = { "^(\\.{1,2}/.*)\\.js$": "$1" };
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log("edited  package.json (jest moduleNameMapper)");
NODE

# ---------------------------------------------------------------- 7. the policy specs
cat > src/common/policies/order.policy.spec.ts << 'EOF'
import { ORDER_ACTIONS, OrderPolicy } from "./order.policy.js";
import type { OrderAction } from "./order.policy.js";
import { ORDER_STATUSES } from "../../orders/order.types.js";
import type { Order, OrderStatus } from "../../orders/order.types.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";

// No HTTP, no database, no Nest: a policy is a function of three arguments.
const policy = new OrderPolicy();

const almaz: AuthenticatedUser = { id: 2, email: "almaz@example.et", roles: ["customer"] };
const dawit: AuthenticatedUser = { id: 3, email: "dawit@example.et", roles: ["customer"] };
const kebede: AuthenticatedUser = { id: 4, email: "kebede@example.et", roles: ["courier"] };
const other: AuthenticatedUser = { id: 7, email: "other@example.et", roles: ["courier"] };
const abyssinia: AuthenticatedUser = { id: 5, email: "abyssinia@example.et", roles: ["restaurant"] };
const staff: AuthenticatedUser = { id: 1, email: "staff@example.et", roles: ["staff"] };

// Almaz's order, assigned to Kebede
const orderIn = (status: OrderStatus): Order => ({
  id: 1, customer: "Almaz Bekele", customerId: almaz.id, courierId: kebede.id, area: "Bole", status,
  restaurantId: 1, paymentMethod: "CASH", dishes: [], totalSantim: 0,
});

describe("OrderPolicy", () => {
  describe("what is allowed", () => {
    it("lets staff do anything to any order, in any state", () => {
      for (const action of ORDER_ACTIONS) for (const status of ORDER_STATUSES) {
        expect(policy.can(staff, action, orderIn(status))).toBe(true);
      }
    });
    it("lets a customer read their own order", () => {
      expect(policy.can(almaz, "read", orderIn("DELIVERED"))).toBe(true);
    });
    it("lets the owner cancel a PENDING order", () => {
      expect(policy.can(almaz, "cancel", orderIn("PENDING"))).toBe(true);
    });
    it("lets a courier read the order assigned to them", () => {
      expect(policy.can(kebede, "read", orderIn("PREPARING"))).toBe(true);
    });
    it.each(["PREPARING", "ON_THE_WAY"] as const)("lets the assigned courier update an order that is %s", (status) => {
      expect(policy.can(kebede, "updateStatus", orderIn(status))).toBe(true);
    });
  });

  describe("what is refused (the tests that catch a rewrite going wrong)", () => {
    it("refuses a customer reading ANOTHER customer's order", () => {
      expect(policy.can(dawit, "read", orderIn("PENDING"))).toBe(false);
    });
    it("refuses a stranger every action on every order, in every state", () => {
      for (const action of ORDER_ACTIONS) for (const status of ORDER_STATUSES) {
        expect(policy.can(dawit, action, orderIn(status))).toBe(false);
      }
    });
    it.each(["PREPARING", "ON_THE_WAY", "DELIVERED", "CANCELLED"] as const)("refuses the owner cancelling once the order is %s", (status) => {
      expect(policy.can(almaz, "cancel", orderIn(status))).toBe(false);
    });
    it("refuses the owner moving their own order's status (that is a courier's job)", () => {
      expect(policy.can(almaz, "updateStatus", orderIn("PREPARING"))).toBe(false);
    });
    it("refuses a courier reading an order that is not assigned to them", () => {
      expect(policy.can(other, "read", orderIn("ON_THE_WAY"))).toBe(false);
    });
    it("refuses a courier cancelling their own assigned order", () => {
      expect(policy.can(kebede, "cancel", orderIn("PENDING"))).toBe(false);
    });
    it.each(["PENDING", "DELIVERED", "CANCELLED"] as const)("refuses the assigned courier updating an order that is %s", (status) => {
      expect(policy.can(kebede, "updateStatus", orderIn(status))).toBe(false);
    });
    it("gives the restaurant role no access to orders by role alone", () => {
      for (const action of ORDER_ACTIONS) expect(policy.can(abyssinia, action, orderIn("PENDING"))).toBe(false);
    });
    it("answers NO to an action it has never heard of (fail closed)", () => {
      expect(policy.can(almaz, "refund" as OrderAction, orderIn("PENDING"))).toBe(false);
    });
    it("refuses an order nobody owns", () => {
      const orphan: Order = { ...orderIn("PENDING"), customerId: undefined, courierId: undefined };
      for (const action of ORDER_ACTIONS) expect(policy.can(almaz, action, orphan)).toBe(false);
    });
  });
});
EOF

# ---------------------------------------------------------------- 8. the written standard
node - << 'NODE'
const fs = require("fs");
let t = fs.readFileSync("docs/api-standard.md", "utf8");
if (!t.includes("## 9. Authorisation")) {
  t = t.trimEnd() + `

## 9. Authorisation (Day 62)

- **Four roles**, kept on the user as an array: \`customer\`, \`courier\`, \`restaurant\`, \`staff\`. A user may hold several. The restaurant role also carries a \`restaurantId\`.
- **The role is a snapshot.** It is copied into the access token at login, so a demotion takes effect when the access token expires: **up to 15 minutes**. That window is accepted and is not zero.
- **Three questions, three places.** What the caller *is* is a role check (\`@Roles\`, \`RolesGuard\`). Whether the order is *theirs*, and what *state* it is in, need the order itself: that is \`OrderPolicy\`, reached through \`@CheckPolicy(action)\` and \`OrderPolicyGuard\`, which loads the order once and hands it to the handler (\`@CurrentOrder()\`).
- **403 or 404: the rule.** *404 for a resource the caller has no right to see; 403 for an action they may not perform on a resource they can legitimately see.* Reading another customer's order is **404**, with the same status and the same message as an order that does not exist, so the ids cannot be counted. A customer cancelling their own order after it left PENDING, or a courier cancelling an assigned order, is **403**. The guard logs the real reason at \`warn\` level.
- **Collections filter too.** \`GET /orders\` and \`GET /restaurants/:id/orders\` return only the orders the caller may read. A guard cannot see a list, so the service filters.
- **Business rules stay in the service.** "Can a DELIVERED order move?" is a 409 from \`OrdersService\`, not a policy. The policy is the one place that answers "may this caller?", and it returns a boolean, never a status code.
- **Staff cancelling** an order that is already gone is still 204 (idempotent, Day 58). For everyone else a missing order is 404.
`;
  fs.writeFileSync("docs/api-standard.md", t); console.log("edited  docs/api-standard.md");
}
NODE

echo
echo "Done. Next:  npx tsc --noEmit && npm test && npm run start:dev   then in another terminal:  bash check-d62.sh"
