import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import framer from "vite-plugin-framer"
import mkcert from "vite-plugin-mkcert"

export default defineConfig({
    plugins: [react(), mkcert(), framer()],
    server: {
        proxy: {
            // Proxy API requests to Lokalise to avoid CORS issues during development
            '/api/lokalise-proxy': {
                target: 'https://api.lokalise.com/api2', // Target Lokalise API base URL
                changeOrigin: true, // Needed for virtual hosted sites
                rewrite: (path) => path.replace(/^\/api\/lokalise-proxy/, ''), // Remove the proxy prefix
            },
        },
    },
})
