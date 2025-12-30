import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "./prisma"

// ============================================
// Environment Variable Validation Helper
// ============================================

/**
 * Validates that NEXTAUTH_SECRET is properly configured.
 * Called at runtime (not build time) to avoid SSG issues.
 */
function validateAuthConfig(): void {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error(
      "NEXTAUTH_SECRET is not set. Please set it in your environment variables."
    );
  }

  if (process.env.NEXTAUTH_SECRET === "your-secret-key-here-change-in-production") {
    console.warn(
      "⚠️  WARNING: You are using the default NEXTAUTH_SECRET. " +
      "Please change it to a unique secret in production!"
    );
  }
}

// Validate NEXTAUTH_URL in production (only warn, don't block build)
if (typeof window === 'undefined' && process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_URL) {
  console.warn(
    "⚠️  WARNING: NEXTAUTH_URL is not set in production. " +
    "This may cause issues with authentication callbacks."
  );
}

// ============================================
// NextAuth Configuration
// ============================================

export const authOptions: NextAuthOptions = {
  // Use env var directly - NextAuth will error if missing at runtime
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate auth config at runtime when auth is actually used
        validateAuthConfig();

        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user) {
          throw new Error("Invalid credentials")
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role
      }
      return session
    },
  },
}

