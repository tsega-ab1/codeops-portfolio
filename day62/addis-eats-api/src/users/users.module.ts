import { Module } from "@nestjs/common";
import { InMemoryUserRepository, USER_REPOSITORY } from "./users.repository.js";
import { UsersService } from "./users.service.js";

@Module({
  providers: [
    UsersService,
    { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
  ],
  exports: [UsersService], // AuthModule borrows it (Day 54's export-and-import rule, again)
})
export class UsersModule {}
