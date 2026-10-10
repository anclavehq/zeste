import type { NextConfig } from 'next';

const config: NextConfig = {
  // Inside this monorepo the zeste packages are TypeScript sources (the published ones are compiled).
  transpilePackages: ['@zeste/core', '@zeste/services', '@zeste/react'],
};

export default config;
