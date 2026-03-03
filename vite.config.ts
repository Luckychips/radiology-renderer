import { defineConfig } from 'vite'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        viteCommonjs(),
        tailwindcss(),
    ],
    optimizeDeps: {
        exclude: ['@cornerstonejs/dicom-image-loader'],
        include: ['dicom-parser'],
    },
    worker: {
        format: 'es',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        },
    },
})
