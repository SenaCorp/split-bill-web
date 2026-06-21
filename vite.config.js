import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const openAiApiKey = env.OPENAI_API_KEY || ''
  const apiBaseUrl = env.API_BASE_URL || 'http://localhost:3000'
  const appBasePath = env.VITE_APP_BASE_PATH || env.APP_BASE_PATH || '/'

  const normalizeBase = (value) => {
    const cleanValue = String(value || '/').trim()
    if (!cleanValue || cleanValue === '/') return '/'
    return `/${cleanValue.replace(/^\/+|\/+$/g, '')}/`
  }

  return {
    plugins: [react()],
    base: normalizeBase(appBasePath),
    server: {
      proxy: {
        '/api/bills': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false
        },
        '/api/payment-proofs': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false
        },
        '/api/receipt-ocr': apiBaseUrl
          ? {
              target: apiBaseUrl,
              changeOrigin: true,
              secure: false
            }
          : {
              target: 'https://api.openai.com',
              changeOrigin: true,
              secure: true,
              rewrite: () => '/v1/responses',
              headers: openAiApiKey
                ? { Authorization: `Bearer ${openAiApiKey}` }
                : undefined
            }
      }
    }
  }
})
