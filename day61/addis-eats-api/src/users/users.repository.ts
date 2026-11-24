import { Injectable } from "@nestjs/common";
import { EmailAlreadyRegisteredError } from "./user.errors.js";
import type { User } from "./user.types.js";

export const USER_REPOSITORY = "USER_REPOSITORY";

export type NewUser = Pick<User, "email" | "passwordHash" | "roles">;

// Async on purpose: PostgreSQL replaces the Map in Module 5 and nothing above this line changes
export interface UserRepository {
  findByEmail(email: string): Promise<User | undefined>;
  findById(id: number): Promise<User | undefined>;
  create(data: NewUser): Promise<User>;
  setRefreshHash(id: number, hash: string | null): Promise<void>;
}

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<number, User>();
  private nextId = 1;

  findByEmail(email: string): Promise<User | undefined> {
    return Promise.resolve([...this.users.values()].find((u) => u.email === email));
  }

  findById(id: number): Promise<User | undefined> {
    return Promise.resolve(this.users.get(id));
  }

  // Uniqueness is enforced HERE, with no await between the check and the insert,
  // so two simultaneous registrations cannot both succeed.
  create(data: NewUser): Promise<User> {
    if ([...this.users.values()].some((u) => u.email === data.email)) {
      return Promise.reject(new EmailAlreadyRegisteredError());
    }
    const user: User = { id: this.nextId++, ...data, refreshHash: null };
    this.users.set(user.id, user);
    return Promise.resolve(user);
  }

  setRefreshHash(id: number, hash: string | null): Promise<void> {
    const user = this.users.get(id);
    if (user) user.refreshHash = hash;
    return Promise.resolve();
  }
}
