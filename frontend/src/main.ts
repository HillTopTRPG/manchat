import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import withUUID from "vue-uuid";
import { register } from './components/panes/plugin'

loadFonts()

const app = createApp(App)
withUUID(app)
register(app)

app
  .use(vuetify)
  .mount('#app')
