import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { nitro } from "nitro/vite"

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    // Bidirectional console piping (browser ↔ Vite SSR) loops on
    // console.error: Vite already forwards client errors to the terminal as
    // `[vite] (client)`, then TanStack echoes those server logs back as
    // `[Server] …`, which the client logs again. Keep Devtools, drop the pipe.
    devtools({
      consolePiping: { enabled: false },
    }),
    tailwindcss(),
    tanstackStart(),
    // Nitro builds the Vercel server output so SSR routes aren't 404s.
    nitro(),
    viteReact(),
  ],
})

export default config
