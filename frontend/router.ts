import { createRouter, createWebHistory } from 'vue-router'
import Room from '~/pages/Room/Root.vue'
import Lobby from '~/pages/Lobby/Root.vue'
import NotFoundRoom from '~/pages/Error/NotFoundRoom.vue'

const router = createRouter({
                              history: createWebHistory(),
                              routes : [
                                {
                                  path     : '/lobby',
                                  name     : 'lobby',
                                  component: Lobby,
                                  props    : r => (
                                    {
                                      room_uuid    : r.query.r,
                                      user_uuid    : r.query.u,
                                      user_name    : r.query.n,
                                      user_password: r.query.p,
                                    }
                                  ),
                                }, {
                                  path     : '/r/:room_uuid',
                                  name     : 'room',
                                  component: Room,
                                  props    : r => (
                                    {
                                      room_uuid    : r.params.room_uuid,
                                      user_uuid    : r.query.u,
                                      user_name    : r.query.n,
                                      user_password: r.query.p,
                                      open         : r.query.open,
                                    }
                                  ),
                                }, {
                                  path     : '/r/:room_uuid/u/:user_uuid',
                                  name     : 'room-user',
                                  component: Room,
                                  props    : r => (
                                    {
                                      room_uuid    : r.params.room_uuid,
                                      user_uuid    : r.params.user_uuid,
                                      user_name    : r.query.n,
                                      user_password: r.query.p,
                                      open         : r.query.open,
                                    }
                                  ),
                                }, {
                                  path     : '/r/not_found',
                                  name     : 'not_found_room',
                                  component: NotFoundRoom,
                                }, {
                                  path     : '/p/not_found',
                                  name     : 'not_found_play',
                                  component: NotFoundRoom,
                                }, {
                                  path    : '/:catchAll(.*)',
                                  redirect: { name: 'lobby' },
                                },
                              ],
                            })

export default router