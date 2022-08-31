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
      props: r => ({
        room_uuid: r.query.r,
        user_uuid: r.query.u,
        user_name: r.query.n,
        user_password: r.query.p,
        auto_play: r.query.auto_play,
      })
    },
    {
      path: '/r/:room_uuid',
      name: 'room',
      component: Room,
      props: r => ({
        room_uuid: r.params.room_uuid,
        user_uuid: r.query.u,
        user_name: r.query.n,
        user_password: r.query.p,
        auto_play: r.query.auto_play,
      })
    },
    {
      path: '/r/:room_uuid/u/:user_uuid',
      name: 'room-user',
      component: Room,
      props: route => ({
        room_uuid: route.params.room_uuid,
        user_uuid: route.params.user_uuid,
        user_name: route.query.n,
        user_password: route.query.p,
        auto_play: route.query.auto_play,
      })
    },
    {
      path: '/r/:room_uuid/u/:user_uuid/p',
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