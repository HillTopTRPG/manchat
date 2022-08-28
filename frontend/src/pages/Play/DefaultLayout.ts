import {uuid} from 'vue-uuid';

export default {
  type: 'vertical',
  uuid: uuid.v4(),
  panes: [
    {
      type: 'horizontal',
      uuid: uuid.v4(),
      size: 90,
      panes: [
        {
          type: 'vertical',
          uuid: uuid.v4(),
          panes: [
            { type: 'normal', uuid: uuid.v4(), panes: [], componentGroup: 'smpl1', component: 'サンプルペイン1', size: 30 },
            { type: 'normal', uuid: uuid.v4(), panes: [], componentGroup: 'ユーザー', component: 'ユーザー一覧' },
            { type: 'normal', uuid: uuid.v4(), panes: [], componentGroup: 'smpl1', component: 'サンプルペイン2', size: 30 },
          ]
        },
        { type: 'normal', uuid: uuid.v4(), panes: [], componentGroup: 'smpl2', component: 'サンプルペイン3', size: 20 },
      ]
    },
    { type: 'normal', uuid: uuid.v4(), panes: [], componentGroup: 'smpl2', component: 'サンプルペイン4' },
  ]
}