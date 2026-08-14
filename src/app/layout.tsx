import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "secret123456789",
  pages: {
    signIn: "/",
    error: "/api/auth/error-debug", // エラー時にリダイレクトさせず画面表示する
  },
  debug: true,
});

export { handler as GET, handler as POST };