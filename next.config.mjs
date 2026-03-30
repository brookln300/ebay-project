/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/ebay',
  async headers() {
    return [
      {
        source: '/api/stripe/webhook',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

export default nextConfig;
