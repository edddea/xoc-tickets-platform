import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { col } from './db';
import type { UserRole } from '@xoc/shared';

// Auth.js — SOLO para staff (admin / organizador / validador).
// El comprador NUNCA inicia sesión (guest checkout).
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  providers: [
    Credentials({
      credentials: { correo: {}, password: {} },
      async authorize(creds) {
        const correo = String(creds?.correo || '').toLowerCase().trim();
        const password = String(creds?.password || '');
        if (!correo || !password) return null;

        const staff = await col('staff');
        const user = await staff.findOne({ correo });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user._id.toString(),
          email: user.correo,
          name: user.nombre ?? user.correo,
          role: user.role as UserRole
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: UserRole }).role;
        token.uid = (user as { id?: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: UserRole }).role = token.role as UserRole;
        (session.user as { id?: string }).id = token.uid as string;
      }
      return session;
    }
  }
});
