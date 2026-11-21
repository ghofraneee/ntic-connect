import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'three-runtime',
              test: /node_modules[\\/]three[\\/]/,
              maxSize: 400_000,
            },
          ],
        },
      },
    },
  },
})
