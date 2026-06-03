/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow missing env vars during build - will be provided at runtime
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
  },
}

module.exports = nextConfig
