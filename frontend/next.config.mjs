/** @type {import('next').NextConfig} */
const apiTarget = (process.env.BKD_API_INTERNAL_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiTarget}/:path*` }];
  },
};
export default nextConfig;
