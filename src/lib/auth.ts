import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { db } from './db'
import { emailOTP } from 'better-auth/plugins'
import { resend } from './resend'
import slugify from 'slugify'
import { env } from './env'

function makeSlug(name: string) {
  return slugify(name, { lower: true, strict: true })
}

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  socialProviders: {
    github: {
      clientId: env.AUTH_GITHUB_CLIENT_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
    }
  },
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 1, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await resend.emails.send({
          from: 'MakerQuest <onboarding@resend.dev>',
          to: [email],
          subject: 'MakerQuest - Email bestätigen',
          html: `<p>Dein OTP ist <strong>${otp}</strong></p>`,
        })
      },
    }),
  ],

  // Create slug on user creation
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const base =
            user.name && user.name.trim().length > 0
              ? makeSlug(user.name)
              : makeSlug(user.email.split('@')[0])

          // console.log('BASE SLUG:', base, 'typeof:', typeof base)

          let slug = base

          const exists = await db.user.findUnique({
            where: { slug },
          })

          if (exists) {
            slug = `${base}-${crypto.randomUUID().slice(0, 5)}`
          }

          // console.log('FINAL SLUG:', slug, 'typeof:', typeof slug)

          // Update the user with the slug
          await db.user.update({
            where: { id: user.id },
            data: { slug },
          })

          // console.log('✅ User created with slug:', updatedUser.slug)

          // return updatedUser
        },
      },
    },
  },

  callbacks: {
    async session({ session, user }: { session: unknown; user: unknown }) {
      // Narrow types safely
      if (
        typeof session !== 'object' ||
        session === null ||
        typeof user !== 'object' ||
        user === null
      ) {
        return session
      }

      const s = session as { user: { id: string } }

      const dbUser = await db.user.findUnique({
        where: { id: s.user.id },
        select: { slug: true },
      })

      return {
        ...s,
        user: {
          ...s.user,
          slug: dbUser?.slug,
        },
      }
    },
  },
})
