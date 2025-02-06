import {defineConfig, type UserConfig} from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
// import autoprefixer from "autoprefixer";
import tailwindcss from '@tailwindcss/vite'

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async ():Promise<UserConfig> => {
  return {
    plugins: [
      tailwindcss(),
      await sveltekit()
    ],
    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port: 1420,
      strictPort: true,
      host: host || false,
      hmr: host
        ? {
          protocol: "ws",
          host,
          port: 1421,
        }
        : undefined,
      watch: {
        // 3. tell vite to ignore watching `src-tauri`
        ignored: ["**/src-tauri/**"],
      },
    },
    // https://stackoverflow.com/questions/78997907/the-legacy-js-api-is-deprecated-and-will-be-removed-in-dart-sass-2-0-0
    css: {
      // postcss: {
      //   plugins: [
      //     tailwindcss,
      //     autoprefixer
      //   ]
      // },
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler' // or "modern"
        }
      }
    }
  }
});
