import type { NextConfig } from 'next';

const config: NextConfig = {
  // The zeste packages are published as TypeScript sources.
  transpilePackages: ['@zeste/core', '@zeste/services', '@zeste/react'],
};

export default config;
