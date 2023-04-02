import ChatGeneralBordLayout from '~/pages/PaneLayoutTemplate/ChatGeneralBordLayout'
import ChatLayout from '~/pages/PaneLayoutTemplate/ChatLayout'
import DefaultLayout from '~/pages/PaneLayoutTemplate/DefaultLayout'

export default [
  {
    layout: DefaultLayout,
    title : '空のペインのみ',
  }, {
    layout: ChatLayout,
    title : 'チャット＋α',
  }, {
    layout: ChatGeneralBordLayout,
    title : 'チャット＋汎用プレイボード',
  },
]