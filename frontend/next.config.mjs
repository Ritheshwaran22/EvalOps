/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (backendUrl && (backendUrl.startsWith('http://') || backendUrl.startsWith('https://'))) {
      const cleanBase = backendUrl.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
      return [
        {
          source: '/api/v1/:path*',
          destination: `${cleanBase}/api/v1/:path*`,
        },
      ];
    }
    return [];
  },
};
export default nextConfig;
