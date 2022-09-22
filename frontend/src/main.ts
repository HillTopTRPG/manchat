import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import withUUID from 'vue-uuid'
import { register } from './components/panes/plugin'
import axios from 'axios'
import VueAxios from 'vue-axios'
// @ts-ignore
import ActionCable from 'actioncable'
import router from '../router'
import { createI18n } from 'vue-i18n'
//import { registerSW } from 'virtual:pwa-register'
//
//registerSW()

const i18n = createI18n({
                          locale         : 'ja-JP', // set locale
                          fallbackLocale : 'en-US', // set fallback locale
                          messages       : {
                            en: {
                              message: {
                                hello: 'hello world',
                              },
                            },
                            ja: {
                              message: {
                                hello: 'こんにちは、世界',
                              },
                            },
                          }, // set locale messages
                          datetimeFormats: {
                            'en-US': {
                              short: {
                                year : 'numeric',
                                month: 'short',
                                day  : 'numeric',
                              },
                              long : {
                                year   : 'numeric',
                                month  : 'short',
                                day    : 'numeric',
                                weekday: 'short',
                                hour   : 'numeric',
                                minute : 'numeric',
                              },
                              time : {
                                hour  : 'numeric',
                                minute: 'numeric',
                                second: 'numeric',
                              },
                            },
                            'ja-JP': {
                              short: {
                                year : 'numeric',
                                month: 'short',
                                day  : 'numeric',
                              },
                              long : {
                                year   : 'numeric',
                                month  : 'short',
                                day    : 'numeric',
                                weekday: 'short',
                                hour   : 'numeric',
                                minute : 'numeric',
                                hour12 : true,
                              },
                              time : {
                                hour  : 'numeric',
                                minute: 'numeric',
                                hour12: true,
                                second: 'numeric',
                              },
                            },
                          },
                        })

const cable = ActionCable.createConsumer('/cable')

loadFonts().then()

const app = createApp(App)
withUUID(app)
register(app)

app
  .use(vuetify)
  .use(router)
  .use(VueAxios, axios)
  .use(i18n)
  .provide('axios', app.config.globalProperties.axios)
  .provide('cable', cable)
  .mount('#app')
