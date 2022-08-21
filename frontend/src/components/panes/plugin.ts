import {App} from 'vue'
import Panes from "../panes"

export const register = (app: App<Element>): void => {
  Object.entries(Panes).forEach(([path, component]) => {
    const pathSplit = component.__file!.split('/')
    const fileName = pathSplit[pathSplit.length - 1].split('.vue')[0]

    // Convert to kebab-case and register
    const kebab = fileName.replace(/([a-z0–9])([A-Z])/g, '$1-$2').toLowerCase()
    app.component(kebab, component)
  })
}