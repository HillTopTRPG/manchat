import Sample, { labelStr as SampleLabel } from './Sample.vue'
import Sample2, { labelStr as Sample2Label } from './Sample2.vue'

const group = 'smpl1'

export default [
  {
    component: Sample,
    label    : SampleLabel,
    group    : group,
  }, {
    component: Sample2,
    label    : Sample2Label,
    group    : group,
  },
]