/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_TIMEZONE: 'Asia/Kathmandu',
    NEXT_PUBLIC_TIMEZONE_OFFSET: '+05:45',
  },
}

module.exports = nextConfig
