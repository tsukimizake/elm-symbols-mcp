// vite.config.js
import { defineConfig } from 'vite'
import { plugin as elm } from 'vite-plugin-elm'

export default defineConfig({
  plugins: [elm()],
  build: { 
    target: 'node22', 
    ssr: "server/server.ts",
    rollupOptions: {
      external: ['@modelcontextprotocol/sdk/server/mcp.js', '@modelcontextprotocol/sdk/server/stdio.js']
    }
  },
})

