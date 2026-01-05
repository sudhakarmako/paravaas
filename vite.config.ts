import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  plugins: [
    devtools(),
    nitro(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  optimizeDeps: {
    exclude: [
      "@duckdb/node-api",
      "@duckdb/node-bindings",
      "@duckdb/node-bindings-darwin-arm64",
      "@duckdb/node-bindings-darwin-x64",
      "@duckdb/node-bindings-linux-arm64",
      "@duckdb/node-bindings-linux-x64",
      "@duckdb/node-bindings-win32-x64",
    ],
  },
  ssr: {
    noExternal: [],
    external: [
      "@duckdb/node-api",
      "@duckdb/node-bindings",
      "@duckdb/node-bindings-darwin-arm64",
      "@duckdb/node-bindings-darwin-x64",
      "@duckdb/node-bindings-linux-arm64",
      "@duckdb/node-bindings-linux-x64",
      "@duckdb/node-bindings-win32-x64",
    ],
  },
});

export default config
