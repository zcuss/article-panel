/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: { serverComponentsExternalPackages: ['better-sqlite3'] },
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'X-Powered-By', value: 'article-panel' }] }];
  },
};
module.exports = nextConfig;
