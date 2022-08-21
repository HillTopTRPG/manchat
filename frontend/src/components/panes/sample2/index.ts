import Sample, { labelStr as SampleLabel } from './Sample3.vue'
import Sample2, { labelStr as Sample2Label } from './Sample4.vue'

const group = "smpl2"

export default [
  { component: Sample, label: SampleLabel, group: group },
  { component: Sample2, label: Sample2Label, group: group }
]