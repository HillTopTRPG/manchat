import noGroupPanes from './NoGroup'
import samplePanes from './sample'
import samplePanes2 from './sample2'
import userPanes from './user'
import chatPanes from './Chat'
import playBoardPanes from './PlayBoard'

const panes = [
  ...noGroupPanes, ...samplePanes, ...samplePanes2, ...userPanes, ...chatPanes, ...noGroupPanes, ...playBoardPanes,
]

export interface Layout {
  type: string
  uuid: string
  componentGroup?: string
  component?: string
  size?: number
  payload: any | null
  panes: Layout[]
}

export default panes

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
      // Convert to kebab-case and register
      items[p.info.label] = p.info.name.replace(/([a-z0–9])([A-Z])/g, '$1-$2').toLowerCase()
    })
})
export const componentMap = map