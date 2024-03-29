import { uuid } from 'vue-uuid'
import { Layout } from '~/components/panes'

const object: Layout = {
  type   : 'vertical',
  uuid   : uuid.v4(),
  payload: null,
  panes  : [
    {
      type   : 'horizontal',
      uuid   : uuid.v4(),
      size   : 90,
      payload: null,
      panes  : [
        {
          type   : 'vertical',
          uuid   : uuid.v4(),
          payload: null,
          panes  : [
            {
              type          : 'normal',
              uuid          : uuid.v4(),
              componentGroup: 'チャット',
              component     : 'チャットビューアー',
              size          : 40,
              payload       : null,
              panes         : [],
            }, {
              type          : 'normal',
              uuid          : uuid.v4(),
              componentGroup: '',
              component     : '初期画面',
              size          : 60,
              payload       : null,
              panes         : [],
            },
          ],
        }, {
          type          : 'normal',
          uuid          : uuid.v4(),
          componentGroup: 'チャット',
          component     : 'チャット入力欄',
          size          : 20,
          payload       : null,
          panes         : [],
        },
      ],
    },
  ],
}

export default object