import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The PDF renderer chunk (~1.2 MB) is only loaded when a user downloads a report.
    chunkSizeWarningLimit: 1300,
  },
})
