import { defineConfig } from 'wxt';
import path from 'path';

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  manifest: {
    name: 'Calcifer',
    description: 'AI-powered webpage understanding assistant',
    permissions: ['activeTab', 'storage', 'sidePanel'],
    host_permissions: ['<all_urls>'],
    action: {},
  },
  vite: () => ({
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }),
});
