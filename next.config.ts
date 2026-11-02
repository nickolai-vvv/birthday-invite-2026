import type { NextConfig } from 'next';
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const basePath = isGithubPages ? '/birthday-invite-2026' : '';

const config: NextConfig = {
  devIndicators: false,
  output: 'export',
  trailingSlash: true,
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: { unoptimized: true },
};
export default config;
