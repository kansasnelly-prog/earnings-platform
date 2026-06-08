import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";

// Plugin to serve API routes during local development
function apiRoutesPlugin(mode: string) {
  return {
    name: 'api-routes',
    configureServer(server: any) {
      // Load environment variables from .env file (load ALL variables, not just VITE_ prefixed)
      const env = loadEnv(mode, process.cwd(), '');
      
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url?.startsWith('/api/')) {
          try {
            // Remove query string from URL
            const urlWithoutQuery = req.url.split('?')[0];
            const filePath = path.resolve(__dirname, urlWithoutQuery.slice(1));
            
            // Try with .js extension if file doesn't exist
            const filePathWithJs = filePath.endsWith('.js') ? filePath : filePath + '.js';
            
            console.log('[API Plugin] Request:', req.method, req.url);
            console.log('[API Plugin] Trying path:', filePathWithJs);
            
            if (fs.existsSync(filePathWithJs)) {
              // Parse request body for POST/PUT requests
              let body = {};
              if (req.method === 'POST' || req.method === 'PUT') {
                const chunks = [];
                for await (const chunk of req) {
                  chunks.push(chunk);
                }
                const bodyStr = Buffer.concat(chunks).toString();
                if (bodyStr) {
                  try {
                    body = JSON.parse(bodyStr);
                  } catch {
                    body = {};
                  }
                }
              }
              
              console.log('[API Plugin] File exists, importing module...');
              // Convert absolute path to file:// URL for Windows ESM compatibility
              const fileUrl = pathToFileURL(filePathWithJs).href;
              console.log('[API Plugin] File URL:', fileUrl);
              // Dynamic import of the API module
              const module = await import(fileUrl);
              console.log('[API Plugin] Module imported, has default export:', !!module.default);
              
              // Call the default export as a handler
              if (module.default) {
                // Create response wrapper that supports chaining like Express/Vercel
                const responseWrapper = {
                  status: (code: number) => {
                    res.statusCode = code;
                    return responseWrapper;
                  },
                  json: (data: any) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                    return responseWrapper;
                  },
                  setHeader: (key: string, value: string) => {
                    res.setHeader(key, value);
                    return responseWrapper;
                  },
                  end: (data: any) => {
                    res.end(data);
                    return responseWrapper;
                  },
                };
                
                // Simulate Vercel's handler signature with environment variables
                // Pass loaded env from .env file to ensure Supabase credentials are available
                await module.default({
                  method: req.method,
                  body: body,
                  headers: req.headers,
                  url: req.url,
                  env: env, // Pass loaded environment variables from .env
                }, responseWrapper);
                return;
              } else {
                console.error('[API Plugin] Module has no default export');
              }
            } else {
              console.error('[API Plugin] File does not exist:', filePathWithJs);
            }
          } catch (error: any) {
            console.error('[API Plugin] Error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
            return;
          }
          
          // If we get here, the route wasn't handled
          console.error('[API Plugin] Route not handled, returning 404');
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Not found' }));
          return;
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5173,
    open: true,
    headers: {
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' * blob: data: https: http:; script-src 'self' 'unsafe-inline' 'unsafe-eval' * blob: data: https: http:; style-src 'self' 'unsafe-inline' * blob: data: https: http:; img-src 'self' 'unsafe-inline' * blob: data: https: http:; font-src 'self' 'unsafe-inline' * blob: data: https: http:; connect-src 'self' 'unsafe-inline' * blob: data: https: http:; media-src * blob: data: https: http:; frame-src 'self' * blob: data: https: http:; worker-src 'self' * blob: data: https: http:; child-src 'self' * blob: data: https: http:;",
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [
    react(),
    apiRoutesPlugin(mode)
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-newtestament-[hash].js',
        chunkFileNames: 'assets/[name]-newtestament-[hash].js',
        assetFileNames: 'assets/[name]-newtestament-[hash].[ext]',
      },
    },
  },
}));
