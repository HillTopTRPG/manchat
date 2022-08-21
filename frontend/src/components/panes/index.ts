import Sample, { labelStr as SampleLabel } from './Sample.vue'
import Sample2, { labelStr as Sample2Label } from './Sample2.vue'

const panes = [
  { component: Sample, label: SampleLabel },
  { component: Sample2, label: Sample2Label }
]

export default panes.map(p => p.component)

const map: {[key: string]: string} = {}
panes.forEach(p => map[p.label] =
  p.component.__file!
    .split('/').pop()!
    .split('.vue')[0]
    .replace(/([a-z0–9])([A-Z])/g, '$1-$2').toLowerCase()
)
export const componentMap = map