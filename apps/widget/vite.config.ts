import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: './src/index.ts',
            name: 'LiveChatWidget',
            fileName: 'sdk',
            formats: ['umd'],
        },
        outDir: '../api/public/widget',
        emptyOutDir: false,
        rollupOptions: {
            external: [],
            output: {
                globals: {},
            },
        },
    },
});
