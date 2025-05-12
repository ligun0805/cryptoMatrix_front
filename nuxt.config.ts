// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from "nuxt/config";
import getRuntimeConfig from "./config/runtime";

export default defineNuxtConfig({
  devtools: {
    enabled: true,
  },

  css: [
    "@/assets/sass/global.sass",
    "bootstrap/dist/css/bootstrap.min.css",
  ],

  modules: ["@pinia/nuxt", "@vueuse/nuxt"],

  pinia: {
    storesDirs: ["./stores/**"],
  },

  nitro: {
    esbuild: {
      options: {
        target: "esnext",
      },
    },
    externals: {
      inline: ['vue']
    }
  },

  runtimeConfig: getRuntimeConfig(),
  compatibilityDate: "2024-07-04",

  experimental: {
    bundler: "vite",
    asyncContext: true,
  },

  vite: {
    resolve: {
      dedupe: ["vue"],
    },
    optimizeDeps: {
      exclude: ["fsevents"],
    },
    css: {
      preprocessorOptions: {
        sass: {
          sassOptions: {
            includePaths: ['./node_modules']
          }
        }
      }
    },
  },
});
