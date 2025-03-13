// auth.ts
import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: { params: { scope: "read:user repo" } },
    }),
  ],
  pages: { signIn: "/auth/signin" },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        // Explicitly cast to string
        token.accessToken = account.access_token as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.accessToken) {
        // Also cast here (or do a typeof check)
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
});