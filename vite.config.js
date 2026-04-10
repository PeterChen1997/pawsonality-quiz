import { defineConfig } from 'vite'

const base = process.env.BASE_PATH || './'

export default defineConfig({
  base,
  build: {
    outDir: 'dist',
  },
})
