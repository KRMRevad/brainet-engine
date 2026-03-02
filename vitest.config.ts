import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'happy-dom',
        include: ['tests/**/*.spec.ts', 'tests/**/*.spec.js'],
        exclude: ['node_modules/', '.aios-core/', 'dist/'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'dist/',
                'tests/',
                '.aios-core/',
            ],
        },
        testTimeout: 30000,
        hookTimeout: 30000,
    },
})
