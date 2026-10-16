/** @type {import('next').NextConfig} */
// NEXT_PUBLIC_BASE_PATH is set only for GitHub Pages (e.g. "/mythos"); at a domain root it is empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default nextConfig;
