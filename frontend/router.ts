import { createRouter,createWebHistory } from 'vue-router';
import Play from '~/pages/Play/Main.vue'
import Lobby from '~/pages/Lobby/Main.vue'
import NotFoundRoom from '~/pages/Error/NotFoundRoom.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/lobby',
      component: Lobby
    },
    {
      path: '/not_found_room',
      component: NotFoundRoom
    },
    {
      path: '/not_found_user',
      component: NotFoundRoom
    },
    {
      path: '/:user_uuid',
      component: Play,
      props: true
    },
    {
      path: '/',
      redirect: (uri: any) => {
        if (!uri.query.user) return { path: '/lobby', query: {} }
        return { path: `/${uri.query.user}`, query: {} }
      },
    },
    {
      path: '/:catchAll(.*)',
      redirect: '/lobby'
    },
  ],
})

export default router;