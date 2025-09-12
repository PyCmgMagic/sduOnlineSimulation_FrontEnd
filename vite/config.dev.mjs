import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
    ],
    server: {
        port: 8082, 
        host: true, // 允许外部访问
        cors: {
            origin: true, // 允许所有来源
            credentials: true, // 允许携带凭证
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        },
        proxy: {
            '/api': {
                target: 'http://localhost:8085',
                changeOrigin: true,
                secure: false,
                // 配置Cookie转发
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.log('proxy error', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, _res) => {
                        console.log('Sending Request to the Target:', req.method, req.url);
                        // 确保Cookie正确转发
                        if (req.headers.cookie) {
                            proxyReq.setHeader('Cookie', req.headers.cookie);
                        }
                    });
                    proxy.on('proxyRes', (proxyRes, req, res) => {
                        console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
                        // 处理Set-Cookie头，确保SameSite设置正确
                        const setCookieHeaders = proxyRes.headers['set-cookie'];
                        if (setCookieHeaders) {
                            const modifiedCookies = setCookieHeaders.map(cookie => {
                                // 在开发环境中修改SameSite为None并添加Secure
                                if (process.env.NODE_ENV === 'development') {
                                    return cookie.replace(/SameSite=\w+/i, 'SameSite=None; Secure');
                                }
                                return cookie;
                            });
                            proxyRes.headers['set-cookie'] = modifiedCookies;
                        }
                    });
                },
            }
        }
    }
})
