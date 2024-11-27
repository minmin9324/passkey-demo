import NextAuth, { DefaultSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      challenge: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    challenge: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = {
          id: credentials?.username || "",
          name: credentials?.username || "",
        };
        if (user.id) {
          return user;
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id; // 사용자 ID 추가
      }
      console.log({ trigger, session });
      if (trigger === "update" && session?.challenge) {
        // challenge 업데이트 요청 시 저장
        token.challenge = session.challenge;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        if (session.user) {
          session.user.id = token.id; // 세션에 사용자 ID 추가
          session.challenge = token.challenge;
        }
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
