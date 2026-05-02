import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'

// Plugin to handle .geojson imports as ES modules in Vitest SSR mode
function geojsonPlugin() {
  return {
    name: 'geojson-loader',
    transform(code: string, id: string) {
      if (id.endsWith('.geojson')) {
        const json = readFileSync(id, 'utf-8')
        return {
          code: `export default ${json}`,
          map: null,
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), geojsonPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
