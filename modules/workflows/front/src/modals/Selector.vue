<template>
  <Modal-Cmp ref="overrideModalRef" cancelString="Cancel" validateString="Ok">
    <template #header>
      {{ ui.header }}
    </template>
    <template #body>
      <Select
        v-model="selected"
        :options="data"
        :option-label="ui.optionLabel"
        :option-value="ui.optionValue"
      />
    </template>
  </Modal-Cmp>
</template>

<script setup>
import { ref } from 'vue';
import ModalCmp from '../../../../../fronts/app/src/components/Modal.vue';
import Select from 'primevue/select';
import {reactTo} from '../helpers/socket';

const overrideModalRef = ref()
const selected = ref()
const ui = ref({
  header: '',
  optionValue: '',
  optionLabel: '',
})
const data = ref([])

reactTo('selector', async ({data: _data, ui: _ui}) => {
  data.value = _data
  ui.value = _ui
  const res = await overrideModalRef.value.open().promise
  if(!res) return
  return selected.value
})
</script>

<style lang="scss" scoped>

</style>