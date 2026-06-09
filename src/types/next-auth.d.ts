import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "OPS_MANAGER";
    schoolId: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "OPS_MANAGER";
      schoolId: string | null;
    } & DefaultSession["user"];
  }
}
