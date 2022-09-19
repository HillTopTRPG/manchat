import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
import vuetify from 'vite-plugin-vuetify'

// https://ja.vitejs.dev/config/
//noinspection JSUnusedGlobalSymbols
export default defineConfig(async ({
                                     command,
                                     mode,
                                   }) => {

  return {
    // yarn dev（ビルド成果物を作らずに直接起動）で起動するときの設定
    server : {
      host      : true, // 公開アドレスの生成に必要
      port      : 3120,
      strictPort: true, // ポートがすでに使用されている場合に、次に使用可能なポートを自動的に試すことなく終了する
      watch     : { usePolling: true },
      hmr       : false, //
      //      https     : {
      //        key : fs.readFileSync('./certificate/localhost-key.pem'),
      //        cert: fs.readFileSync('./certificate/localhost.pem'),
      //      },
    }, // yarn preview（yarn buildで生成されるdistフォルダ）で起動するときの設定
    preview: {
      host      : true, // 公開アドレスの生成に必要
      port      : 3120,
      strictPort: true, // ポートがすでに使用されている場合に、次に使用可能なポートを自動的に試すことなく終了する
      //      https     : true,
    },
    plugins: [
      vue(), vuetify({ autoImport: true }), VitePWA({
                                                      registerType : 'autoUpdate',
                                                      includeAssets: [
                                                        'offline.html',
                                                        'favicon.svg',
                                                        'favicon.ico',
                                                        'robots.txt',
                                                        'apple-touch-icon.png',
                                                      ],
                                                      manifest     : {
                                                        'theme_color'     : '#91c4fb',
                                                        'background_color': '#91c4fb',
                                                        'display'         : 'fullscreen',
                                                        'scope'           : '/',
                                                        'start_url'       : '/',
                                                        'name'            : 'Quoridorn',
                                                        'short_name'      : 'Quoridorn',
                                                        'description'     : 'Online Session Tool',
                                                        'icons'           : [
                                                          {
                                                            'src'  : '/icon-192x192.png',
                                                            'sizes': '192x192',
                                                            'type' : 'image/png',
                                                          }, {
                                                            'src'  : '/icon-256x256.png',
                                                            'sizes': '256x256',
                                                            'type' : 'image/png',
                                                          }, {
                                                            'src'  : '/icon-384x384.png',
                                                            'sizes': '384x384',
                                                            'type' : 'image/png',
                                                          }, {
                                                            'src'  : '/icon-512x512.png',
                                                            'sizes': '512x512',
                                                            'type' : 'image/png',
                                                          },
                                                        ],
                                                      },
                                                    }),
    ],
    resolve: {
      alias: {
        // @ts-ignore
        '~/': `${__dirname}/src/`,
      },
    },
  }
})
