import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
// import { PrismaClient } from './generated/prisma/client'
import {db}  from './db'
import { emailOTP } from 'better-auth/plugins'
import { resend } from './resend'


// console.log('Prisma models:', Object.keys(db))  // Should include 'verification'

// const db = new PrismaClient()
export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql', // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
  },

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
      // async sendVerificationOTP({ email, otp, type }) {
            await resend.emails.send({
              from: 'MakerQuest <onboarding@resend.dev>',  
              // change to our email
              to: [email],
              subject: 'MakerQuest - Email bestätigen',
              html: `<p> Dein OTP ist <strong>${otp}</strong></p>`
              // react: EmailTemplate({ firstName: 'John' }),
            })
        // if (type === 'sign-in') {
        //   // Send the OTP for sign in
        // } else if (type === 'email-verification') {
        //   // Send the OTP for email verification
        // } else {
        //   // Send the OTP for password reset
        // }
      },
    }),
  ],
  
})
