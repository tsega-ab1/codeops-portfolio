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
