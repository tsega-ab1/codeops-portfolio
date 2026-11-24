import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { USER_REPOSITORY } from "./users.repository.js";
import type { NewUser, UserRepository } from "./users.repository.js";
import type { User } from "./user.types.js";
import { SEED_USERS } from "./users.seed.js";

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @Inject(USER_REPOSITORY) private readonly repo: UserRepository,
    private readonly config: ConfigService,
  ) {}

  // The three development users. Skipped entirely in production.
  async onModuleInit(): Promise<void> {
    if (this.config.get<string>("NODE_ENV") === "production") return;
    const password = this.config.getOrThrow<string>("SEED_PASSWORD");
    await Promise.all(
      SEED_USERS.map(async (seed) =>
        this.repo.create({
          email: seed.email,
          roles: seed.roles,
          passwordHash: await argon2.hash(password), // each user gets its own salt
        }),
      ),
    );
  }

  findByEmail(email: string): Promise<User | undefined> {
    return this.repo.findByEmail(email);
  }

  findById(id: number): Promise<User | undefined> {
    return this.repo.findById(id);
  }

  create(data: NewUser): Promise<User> {
    return this.repo.create(data);
  }

  setRefreshHash(id: number, hash: string | null): Promise<void> {
    return this.repo.setRefreshHash(id, hash);
  }
}
