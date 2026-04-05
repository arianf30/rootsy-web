/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Solo en `next dev`: Next bloquea (403) recursos internos `/_next/*` si el
   * `Origin` / `Referer` no está permitido (protección CSRF entre sitios).
   *
   * Acá van los **hostnames de la URL donde servís la app**, p. ej. la IP LAN
   * de **esta máquina** (`http://192.168.x.x:3000`), **no** la IP del celular
   * u otra PC que solo visita el sitio.
   */
  allowedDevOrigins: [
    "192.168.1.14",
    "192.168.1.56",
    "192.168.1.72",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "londonmanager.com",
        pathname: "/static/media/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
}

export default nextConfig
