import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      // Reachable from a phone on the same Wi-Fi (`npm run dev` prints the Network URL).
      host: true,
      // Allow a tunnel hostname (cloudflared or ngrok) to reach the dev server.
      allowedHosts: ['.trycloudflare.com', '.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app', '.ngrok.dev'],
      // Dev-only: with VITE_API_URL=/api the browser (or a phone) only talks to this one
      // origin, and the dev server forwards /api to the backend. No CORS, same-origin cookies.
      proxy: {
        '/api': {
          target: env.DEV_API_PROXY_TARGET || 'http://localhost:8000',
          changeOrigin: true,
          // The backend scopes the refresh cookie to Path=/auth; behind the /api prefix it must be /api/auth.
          cookiePathRewrite: { '/auth': '/api/auth' },
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      // The PDF renderer chunk (~1.2 MB) is only loaded when a user downloads a report.
      chunkSizeWarningLimit: 1300,
    },
  }
})
