/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable webpack's persistent filesystem cache (.next/cache/webpack).
  // On a near-full disk this cache write fails with EIO and crashes the
  // dev server; skipping it costs a bit of rebuild speed but nothing else.
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};
export default nextConfig;
