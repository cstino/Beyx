import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const removeBgPlugin = () => ({
  name: 'remove-bg-proxy',
  configureServer(server) {
    server.middlewares.use('/api/remove-bg', (req, res, next) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const env = loadEnv('development', process.cwd(), '');
            const apiKey = env.REMOVE_BG_API_KEY;

            if (!apiKey || apiKey.includes('inserisci_qui')) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'API Key Remove.bg non configurata nel file .env' }));
              return;
            }

            const { imageBase64 } = JSON.parse(body);
            const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
            const blob = new Blob([buffer], { type: 'image/png' });
            
            const formData = new FormData();
            formData.append('image_file', blob, 'input.png');
            formData.append('size', 'auto');

            const response = await fetch('https://api.remove.bg/v1.0/removebg', {
              method: 'POST',
              headers: {
                'X-Api-Key': apiKey
              },
              body: formData
            });

            if (!response.ok) {
              const errText = await response.text();
              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: `Errore Remove.bg (${response.status}): ${errText}` }));
              return;
            }

            const arrayBuffer = await response.arrayBuffer();
            const resultBuffer = Buffer.from(arrayBuffer);
            const resultBase64 = `data:image/png;base64,${resultBuffer.toString('base64')}`;

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, resultBase64 }));
          } catch (err) {
            console.error('Remove.bg Proxy Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      } else {
        next();
      }
    });
  }
});

export default defineConfig({
  plugins: [
    removeBgPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'beyx_icon.svg', 'beyx_icon512.png', 'assets/academy/*.png'],
      manifest: {
        name: 'BeyManager X',
        short_name: 'BeyX',
        description: 'Elite Beyblade X Companion',
        theme_color: '#0A0A1A', // quasi nero ma pastello
        background_color: '#0A0A1A', // sfondo caricamento (splash screen)
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/beyx_icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/beyx_icon512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000
  }
})
