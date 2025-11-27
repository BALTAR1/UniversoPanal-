// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// 🚀 CONFIG PARA STATIC SITE (Render)
// NO usa SSR
// NO usa @astrojs/node
export default defineConfig({
  output: 'static',            // 🔥 obligatorio para static hosting
  integrations: [react()],
  
  vite: {
    plugins: [tailwindcss()],
  },

  // No hace falta configurar puerto porque NO se ejecuta como servidor.
});
