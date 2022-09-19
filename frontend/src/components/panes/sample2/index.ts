import Sample, { componentInfo as Sample3Info } from './Sample3.vue'
import Sample2, { componentInfo as Sample4Info } from './Sample4.vue'

const group = 'smpl2'

export default [
  {
    component: Sample,
    info     : Sample3Info,
    group    : group,
  }, {
    component: Sample2,
    info     : Sample4Info,
    group    : group,
  },
]