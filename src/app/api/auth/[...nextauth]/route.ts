// export { GET, POST } from "@/auth";

// src/app/api/auth/[...nextauth]/route.ts
// import NextAuth from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import CredentialsProvider from "next-auth/providers/credentials";
// import { getSupabase } from "@/utils/supabase/getSupabase";

// import type { JWT } from "next-auth/jwt";
// import type { Session } from "next-auth";
// const authOptions = {
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     }),
// CredentialsProvider({
//   name: "Credentials",
//   credentials: {
//     email: { label: "Email", type: "text" },
//     password: { label: "Password", type: "password" },
//   },
//   async authorize(credentials) {
//     // Narrow the types manually
//     const email = credentials?.email as string | undefined;
//     const password = credentials?.password as string | undefined;

//     if (!email || !password) return null;

//     const supabase = await getSupabase();

//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error || !data.user) return null;

//     return {
//       id: data.user.id,
//       email: data.user.email,
//       name: data.user.user_metadata?.full_name || data.user.email,
//     };
//   },
// })


//   ],
//   callbacks: {
//     async jwt({ token, account, user }: { token: JWT; account?: any; user?: any }) {
//       if (account) (token as any).accessToken = account.access_token;
//       if (user) (token as any).user = user;
//       return token;
//     },

//        async session({ session, token }: { session: Session; token: JWT }) {
//       (session as any).accessToken = (token as any).accessToken;
//       (session as any).user = (token as any).user;
//       return session;
//     },

//       async signIn({ user, account }: { user: any; account?: any }) {
//       return true;
//     },
//   },
// };

// const handler = NextAuth(authOptions);

// // ✅ Only named exports, no default
// export { handler as GET, handler as POST };
// import NextAuth from "next-auth";
// import Credentials from "next-auth/providers/credentials";
// import Google from "next-auth/providers/google";
// import type { JWT } from "next-auth/jwt";
// import type { Session } from "next-auth";

// const authConfig = {
//   providers: [
//     // Credentials login
//     Credentials({
//       name: "Credentials",
//       credentials: {
//         email: { label: "Email", type: "text" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(
//         credentials: Partial<Record<"email" | "password", unknown>>,
//         _req: Request
//       ) {
//         const email = credentials?.email as string | undefined;
//         const password = credentials?.password as string | undefined;

//         if (!email || !password) return null;

//         // Fake user
//         return { id: "1", email, name: "Test User" };
//       },
//     }),

//     // ✅ Google login provider
//     Google({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//     }),
//   ],

//   secret: process.env.NEXTAUTH_SECRET,

//   callbacks: {
//     async jwt({
//       token,
//       account,
//       user,
//     }: {
//       token: JWT;
//       account?: any;
//       user?: any;
//     }) {
//       // Save OAuth access_token
//       if (account) {
//         token.accessToken = account.access_token;
//         token.provider = account.provider;
//       }

//       if (user) token.user = user;

//       return token;
//     },

//     async session({ session, token }: { session: Session; token: JWT }) {
//       (session as any).accessToken = token.accessToken;
//       (session as any).provider = token.provider;
//       (session as any).user = token.user;
//       return session;
//     },
//   },
// };

// // Export for App Router
// export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// export const GET = handlers.GET;
// export const POST = handlers.POST;

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import type { Account, User } from "next-auth";

const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
    try {
      const parsedUrl = new URL(url, baseUrl);
      const redirectedFrom = parsedUrl.searchParams.get("redirectedFrom");

      if (redirectedFrom) {
        return `${baseUrl}${redirectedFrom}`;
      }

      // Handle relative URLs like /dashboard
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // Default fallback
      return `${baseUrl}/dashboard`;
    } catch (e) {
      console.error("Redirect callback error:", e);
      return `${baseUrl}/dashboard`;
    }
  },
    async jwt({ token, account, user }: { token: JWT; account?: Account | null; user?: User }) {
      if (account) {
        (token as any).accessToken = account.access_token;
        (token as any).provider = account.provider;
      }
      if (user) {
        (token as any).user = user;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      (session as any).accessToken = (token as any).accessToken;
      (session as any).provider = (token as any).provider;
      (session as any).user = (token as any).user;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
export const GET = handlers.GET;
export const POST = handlers.POST;