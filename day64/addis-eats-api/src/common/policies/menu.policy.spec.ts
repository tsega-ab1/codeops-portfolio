import type { AuthenticatedUser } from "../auth/auth.types.js";
import { MenuPolicy } from "./menu.policy.js";

const policy = new MenuPolicy();
const user = (roles: AuthenticatedUser["roles"], restaurantId?: number): AuthenticatedUser => ({ id: 9, email: "u@example.et", roles, restaurantId });

describe("MenuPolicy", () => {
  it("lets staff manage any restaurant's menu", () => {
    expect(policy.canManage(user(["staff"]), 1)).toBe(true);
    expect(policy.canManage(user(["staff"]), 2)).toBe(true);
  });
  it("lets a restaurant user manage its OWN menu", () => {
    expect(policy.canManage(user(["restaurant"], 1), 1)).toBe(true);
  });

  describe("what is refused", () => {
    it("refuses a restaurant user on ANOTHER restaurant's menu", () => {
      expect(policy.canManage(user(["restaurant"], 1), 2)).toBe(false);
    });
    it("refuses a restaurant user whose token carries no restaurantId", () => {
      expect(policy.canManage(user(["restaurant"]), 1)).toBe(false);
    });
    it("refuses a customer, even one who somehow carries a restaurantId", () => {
      expect(policy.canManage(user(["customer"]), 1)).toBe(false);
      expect(policy.canManage(user(["customer"], 1), 1)).toBe(false);
    });
    it("refuses a courier", () => {
      expect(policy.canManage(user(["courier"], 1), 1)).toBe(false);
    });
  });
});
