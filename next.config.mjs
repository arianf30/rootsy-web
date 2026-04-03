/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: [
    '192.168.1.56',
    // IP del otro equipo que abre el dev (cambiá si no coincide):
    '192.168.1.72'
  ],
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'londonmanager.com',
        pathname: '/static/media/**'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**'
      }
    ]
  }
}

export default nextConfig
