// electron.vite.config.ts
import { resolve } from "path";
import { defineConfig } from "electron-vite";
import vue from "@vitejs/plugin-vue";
import wasm from "vite-plugin-wasm";
import AutoImport from "unplugin-auto-import/vite";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
var electron_vite_config_default = defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src")
      }
    },
    plugins: [
      vue(),
      wasm(),
      createSvgIconsPlugin({
        iconDirs: [resolve(process.cwd(), "./src/renderer/src/assets/icons/svg")],
        // 配置SVG目录
        symbolId: "icon-[name]"
        // 设置使用 symbol 模式
      }),
      AutoImport({
        imports: [
          "vue",
          // 自动引入 ref, reactive, etc.
          "vue-router",
          // 自动引入 useRoute, useRouter
          "pinia"
          // 如果你使用 pinia
        ],
        dts: "src/auto-imports.d.ts"
        // 生成对应的 .d.ts 文件
      })
    ],
    server: {
      host: "0.0.0.0",
      port: 5200
    }
  }
});
export {
  electron_vite_config_default as default
};
