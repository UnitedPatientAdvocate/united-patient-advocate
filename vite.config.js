import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.ANTHROPIC_API_KEY ||= env.ANTHROPIC_API_KEY

  const readJsonBody = req => new Promise((resolve, reject) => {
    let rawBody = ''
    req.on('data', chunk => {
      rawBody += chunk
    })
    req.on('end', () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })

  return {
    plugins: [
      react(),
      {
        name: 'local-api-analyze',
        configureServer(server) {
          server.config.logger.info('[local-api-analyze] serving POST /api/analyze')

          server.middlewares.use(async (req, res, next) => {
            const pathname = new URL(req.url || '/', 'http://localhost').pathname
            if (pathname !== '/api/analyze') {
              next()
              return
            }

            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end()
              return
            }

            try {
              req.body = await readJsonBody(req)
              const { default: handler } = await import('./api/analyze.js')
              await handler(req, {
                status(code) {
                  res.statusCode = code
                  return this
                },
                json(data) {
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(data))
                },
                end(data) {
                  res.end(data)
                },
              })
            } catch (error) {
              server.config.logger.error(error)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Local API request failed' }))
            }
          })
        },
      },
    ],
  }
})

