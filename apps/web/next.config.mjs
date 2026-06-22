/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@xoc/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' }
    ]
  }
};

export default nextConfig;
