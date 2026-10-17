/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // These are supported on both plain HTTP localhost previews and HTTPS.
  // HSTS/CSP need a separately verified TLS/nonced-script release boundary.
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'X-DNS-Prefetch-Control', value: 'off' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      ],
    }];
  },
};

export default nextConfig;
