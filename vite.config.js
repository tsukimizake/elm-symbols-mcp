// vite.config.js
import { defineConfig } from 'vite'
import elm from 'vite-plugin-elm-watch'

export default defineConfig({
  plugins: [elm()],
  build: { target: 'node22', ssr:"server/server.ts" },
})

