import { uuid } from 'vue-uuid'

export default {
  type : 'vertical',
  uuid : uuid.v4(),
  panes: [
    {
      type : 'horizontal',
      uuid : uuid.v4(),
      size : 90,
      panes: [
        {
          type : 'vertical',
          uuid : uuid.v4(),
          panes: [
            {
              type          : 'normal',
              uuid          : uuid.v4(),
              panes         : [],
              componentGroup: 'チャット',
              component     : 'チャットビューアー',
              size          : 40,
            }, {
              type          : 'normal',
              uuid          : uuid.v4(),
              panes         : [],
              componentGroup: 'smpl1',
              component     : 'サンプルペイン2',
              size          : 60,
            },
          ],
        }, {
          type          : 'normal',
          uuid          : uuid.v4(),
          panes         : [],
          componentGroup: 'チャット',
          component     : 'チャット入力欄',
          size          : 20,
        },
      ],
    }, {
      type          : 'normal',
      uuid          : uuid.v4(),
      panes         : [],
      componentGroup: 'smpl2',
      component     : 'サンプルペイン4',
    },
  ],
}