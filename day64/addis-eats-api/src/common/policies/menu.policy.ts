import { Injectable } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth.types.js";

// Staff manage every menu. The restaurant role manages ONLY its own: the user's restaurantId (carried in the token since
// Day 64, as a snapshot like the roles) must equal the restaurant the dish or image belongs to.
// Like OrderPolicy it returns a boolean and throws nothing. A menu is public, so a refusal is 403, not 404: nothing is being hidden.
@Injectable()
export class MenuPolicy {
  canManage(user: AuthenticatedUser, restaurantId: number): boolean {
    if (user.roles.includes("staff")) return true;
    return user.roles.includes("restaurant") && user.restaurantId !== undefined && user.restaurantId === restaurantId;
  }
}
