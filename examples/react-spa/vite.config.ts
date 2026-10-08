import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // In this monorepo, @zeste/react has its own React (dev dependency): use the app's one only.
  resolve: { dedupe: ['react', 'react-dom'] },
});
