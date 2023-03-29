<template>
  <div class="diff-root">
    <h1>Differences</h1>
    <section-cmp>
      <Editor style="height: calc(100vh - 200px)"
        :diff="true"
      />
    </section-cmp>
  </div>
</template>

<script setup>
import SectionCmp from '@/components/Section.vue'
import axios from '@/helpers/axios'
import {ref, onMounted} from 'vue'
const original = ref('')
const modified = ref('')
</script>

<style scoped lang="scss">
.diff-root,.section-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
</style>