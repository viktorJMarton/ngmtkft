import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { seoPlugin } from './seo/plugin.js';

export default defineConfig({
  base: '/',
  plugins: [tailwindcss(), seoPlugin()],
});
