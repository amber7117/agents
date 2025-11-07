import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [
        react(),
        tsconfigPaths(),
    ],

    // CSS Modules：kebab -> camel，保留原类名可同时访问
    css: {
        modules: {
            localsConvention: 'camelCase'
        }
    },

    server: {
        host: true,        // 允许局域网访问
        port: 5173,
        strictPort: true,  // 5173 被占用就报错（方便 CI/容器）
        // 想要本地同源开发时启用（前端走 /api -> http://localhost:4000）
        // proxy: {
        //   '/api': {
        //     target: 'http://localhost:4000',
        //     changeOrigin: true
        //   },
        //   '/auth': {
        //     target: 'http://localhost:4000',
        //     changeOrigin: true
        //   }
        // },
        // Monorepo 有时需要放开上层目录（HMR 扫描）
        fs: { allow: ['..'] }
    },

    build: {
        outDir: 'dist',
        sourcemap: true,
        target: 'es2022',   // 与 tsconfig 的 ES2022 对齐
    },

    // 预构建优化（Monorepo 常见库提前打包，避免 HMR 报错）
    optimizeDeps: {
        include: ['socket.io-client', 'qrcode']
    },

    // 若你要在代码里用 process.env（不推荐），可以取消注释：
    // define: {
    //   'process.env': {}
    // }
});
