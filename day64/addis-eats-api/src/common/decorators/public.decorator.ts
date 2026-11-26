import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

// Routes are PROTECTED by default. Forgetting @Public() makes a route too strict and somebody
// reports it within a day. Forgetting a guard would leave it open, and nobody would report that.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
