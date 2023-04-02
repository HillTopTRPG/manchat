<script setup lang='ts'>
import 'splitpanes/dist/splitpanes.css'
import { componentMap, Layout } from './panes'

const props = defineProps<{
  isSingle: boolean
}>()

const emits = defineEmits<{
  (e: 'change-component', componentGroup: string, component: string): void
  (e: 'change-layout', newLayout: Layout): void
}>()
</script>

<template>
  <h3 class='mx-5 mt-5'>空のペイン</h3>
  <p class='mx-5'>
    ペインはツールを１つ選んで表示できます。<br>
    メニューバーの
    <v-icon icon='mdi-pencil-ruler' />
    でペイン編集モードを切り替えることでペインを追加したり、後から表示するツールを変更できます。
  </p>
  <p class='mx-5 mt-5'>表示するツールを選ぶ</p>
  <v-list density='compact' class='mx-5 mb-5' open-strategy='multiple'>
    <template
      v-for='g in componentMap'
      :key='g.group'
    >
      <v-list-group v-if='g.group'>
        <template #activator='{ props }'>
          <v-list-item v-bind='props' :title='g.group' />
        </template>

        <v-list-item
          v-for='n in Object.keys(g.items)'
          :title='n'
          :value='n'
          @click='emits("change-component", g.group, n)'
        />
      </v-list-group>
      <template v-else>
        <v-list-item
          v-for='n in Object.keys(g.items)'
          :title='n'
          :value='n'
          @click='emits("change-component", g.group, n)'
        />
      </template>
    </template>
  </v-list>
  <p class='mx-5 mt-5'>または...</p>
  <p class='mx-5 mt-5'>構成済みレイアウトのプリセットを選ぶ</p>
  <v-list density='compact' class='mx-5 mb-5' open-strategy='multiple'>
    <v-list-item @click='emits("change-layout")'>チャット＋α</v-list-item>
  </v-list>
</template>

<!--suppress HtmlUnknownAttribute, CssUnusedSymbol -->
<style deep lang='css'>
</style>
