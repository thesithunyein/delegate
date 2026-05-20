/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Hackathon escape hatch: toolkit/viem type drift shouldn't block deploys.
  // Local dev still surfaces errors via `pnpm typecheck`.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
