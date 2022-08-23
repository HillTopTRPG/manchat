import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import withUUID from "vue-uuid";
import { register } from './components/panes/plugin'
import axios from "axios";
import VueAxios from "vue-axios";

loadFonts()

const app = createApp(App)
withUUID(app)
register(app)

app.use(VueAxios, axios)
app.provide("axios", app.config.globalProperties.axios)

app
  .use(vuetify)
  .mount('#app')
