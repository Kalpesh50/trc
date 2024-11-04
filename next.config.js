/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'amlcheck.in',
        pathname: '/static/media/**',
      },
    ],
  },
  reactStrictMode: true,
  // Add this to allow connections from other devices
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' }
        ],
      },
    ]
  }
}

module.exports = nextConfig
