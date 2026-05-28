import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      emailVerified?: boolean;
    };
  }

  interface User {
    id: string;
    role: Role;
    rememberMe?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    rememberMe?: boolean;
    emailVerified?: boolean;
  }
}
