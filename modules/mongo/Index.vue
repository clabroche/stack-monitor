<template>
  <div class="uuid-root">
    <section-cmp header="ObjectId">
      <div class="section-content">
        <h2>ObjectId('{{ uuid }}')</h2>
        <button @click="generate">
          <i class="fas fa-random"></i>
          Regenerate
        </button>
      </div>
    </section-cmp>
    <section-cmp header="Decode ObjectId">
      <div class="section-content">
        <h2>{{ decodedObjectId.date?.format?.('YYYY-MM-DD hh:mm:ss') }}</h2>
        <input type="text" v-model="uuid">
      </div>
    </section-cmp>
    <section-cmp header="Encode Date">
      <div class="section-content">
        <input type="datetime-local" v-model="date">
      </div>
    </section-cmp>
  </div>
</template>

<script setup>
import SectionCmp from '@/components/Section.vue'
import axios from '@/helpers/axios'
import {ref, onMounted, watchEffect } from 'vue'
import dayjs from 'dayjs'

const uuid = ref()
const decodedObjectId = ref(null)
const date = ref(null)

const dateFromObjectId = (objectId) => (dayjs(parseInt(objectId.substring(0, 8), 16) * 1000))
const objectIdFromDate = (date) => (Math.floor(date.getTime() / 1000).toString(16) + "0000000000000000")

onMounted(generate)
async function generate() {
  const {data: _uuid} = await axios.get('/mongo/generate')
  uuid.value = _uuid
  date.value = dateFromObjectId(_uuid).format('YYYY-MM-DDThh:mm')
  decodeObjectId(_uuid)
}

watchEffect(() => decodeObjectId(uuid.value))
watchEffect(() => uuid.value = objectIdFromDate(dayjs(date.value).toDate()))

function decodeObjectId(objectId) {
  decodedObjectId.value = {
    date: dateFromObjectId(objectId || '')
  }
}
</script>

<style scoped lang="scss">
.uuid-root,.section-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
</style>