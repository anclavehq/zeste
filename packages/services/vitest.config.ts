import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    environmentOptions: {
      happyDOM: {
        url: 'https://example.com/',
        // Check which scripts are injected, without downloading them.
        settings: { disableJavaScriptFileLoading: true, disableIframePageLoading: true, handleDisabledFileLoadingAsSuccess: false },
      },
    },
    // Vendor loaders (Userflow) reject when their script fails to download, which is always the case here.
    onUnhandledError: (error) => !/^Could not load /.test(error.message ?? ''),
  },
});
