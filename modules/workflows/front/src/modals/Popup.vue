<template>
  <Modal-Cmp ref="overrideModalRef" :noCancel="true" validateString="Ok">
    <template #header>
      {{ ui.header }}
    </template>
    <template #body>
      <div v-html="ui.html"></div>
    </template>
  </Modal-Cmp>
</template>

<script setup>
import { ref } from 'vue';
import ModalCmp from '../../../../../fronts/app/src/components/Modal.vue';
import {reactTo} from '../helpers/socket';

const overrideModalRef = ref()
const selected = ref()
const ui = ref({
  header: '',
  html: '',
})
reactTo('displayPopup', async ({ui: _ui}) => {
  ui.value = _ui
  const res = await overrideModalRef.value.open().promise
  if(!res) return
  return selected.value
})
</script>

<style lang="scss" scoped>

</style>