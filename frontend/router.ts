import { createRouter,createWebHistory } from 'vue-router';
import Play from '~/pages/Play/Root.vue'
import Room from '~/pages/Room/Root.vue'
import Lobby from '~/pages/Lobby/Root.vue'
import NotFoundRoom from '~/pages/Error/NotFoundRoom.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/lobby',
      name: 'lobby',
      component: Lobby,
      props: route => ({ room_id: route.query.r, user_id: route.query.u, user_name: route.query.n, user_password: route.query.p })
    },
    {
      path: '/r/:room_uuid',
      name: 'room',
      component: Room,
      props: route => ({ room_uuid: route.params.room_uuid, user_id: route.query.u, user_name: route.query.n, user_password: route.query.p })
    },
    {
      path: '/p/:user_uuid',
      name: 'play',
      component: Play,
      props: true
    },
    {
      path: '/r/not_found',
      name: 'not_found_room',
      component: NotFoundRoom
    },
    {
      path: '/p/not_found',
      name: 'not_found_play',
      component: NotFoundRoom
    },
    {
      path: '/:catchAll(.*)',
      redirect: { name: 'lobby' }
    },
  ],
})

export default router;