import samplePanes from './sample'
import samplePanes2 from './sample2'
import userPanes from './user'

const panes = [
  ...samplePanes, ...samplePanes2, ...userPanes,
]

export default panes.map(p => p.component)

const map: { group: string, items: { [key: string]: string } }[] = []
const groups: string[]                                           = []
panes.forEach(p => {
  if (!groups.some(g => g === p.group)) {
    groups.push(p.group)
  }
})
groups.sort()
groups.forEach(g => {
  const items: { [key: string]: string } = {}
  map.push({
             group: g,
             items: items,
           })
  panes
    .filter(p => p.group === g)
    .forEach(p => {
      items[p.label] = p.component.__file!
        .split('/').pop()!
        .split('.vue')[0]
        .replace(/([a-z0–9])([A-Z])/g, '$1-$2').toLowerCase()
    })
})
export const componentMap = map