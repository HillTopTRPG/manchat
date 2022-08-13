import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
import vuetify from 'vite-plugin-vuetify'

// https://ja.vitejs.dev/config/
export default defineConfig({
  // yarn dev（ビルド成果物を作らずに直接起動）で起動するときの設定
  server: {
    host: true, // 公開アドレスの生成に必要
    port: 3120,
    strictPort: true, // ポートがすでに使用されている場合に、次に使用可能なポートを自動的に試すことなく終了する
    watch: { usePolling: true }
  },
  // yarn preview（yarn buildで生成されるdistフォルダ）で起動するときの設定
  preview: {
    host: true, // 公開アドレスの生成に必要
    port: 3120,
    strictPort: true // ポートがすでに使用されている場合に、次に使用可能なポートを自動的に試すことなく終了する
  },
  plugins: [
		vue(),
		vuetify({ autoImport: true }),
  ],
})
