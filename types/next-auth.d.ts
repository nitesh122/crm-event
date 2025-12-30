import { UserRole } from "@prisma/client"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    role: UserRole
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
  }
}
