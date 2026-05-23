import { type NextAuthConfig } from "next-auth";

/**
 * Minimal auth config — providers and adapter will be configured in Task 5
 * when credentials-based auth (email + bcrypt) is implemented.
 */
export const authConfig = {
  providers: [],
} satisfies NextAuthConfig;
