import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Library build mode
  if (mode === 'lib') {
    return {
      plugins: [
        react(),
        dts({
          insertTypesEntry: true,
          include: ['src/**/*.ts', 'src/**/*.tsx'],
          outDir: 'dist',
        }),
      ],
      build: {
        lib: {
          entry: path.resolve(__dirname, 'src/lib.ts'),
          name: 'MeetingMinutesAssistant',
          formats: ['es', 'cjs'],
          fileName: (format) => `index.${format}.js`,
        },
        rollupOptions: {
          external: ['react', 'react-dom', 'react/jsx-runtime'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
              'react/jsx-runtime': 'jsxRuntime',
            },
          },
        },
        outDir: 'dist',
        sourcemap: true,
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        },
      },
    };
  }

  // Dev/App build mode (default)
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
