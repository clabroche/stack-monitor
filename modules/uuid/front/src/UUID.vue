<template>
  <div class="uuid-root">
    <h1>Generate UUID</h1>
    <SectionCmp>
      <div class="section-content">
        <h2>{{ uuid }}</h2>
        <button @click="generate">
          <i class="fas fa-random"></i>
          Regenerate
        </button>
      </div>
    </SectionCmp>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
import axios from '../../../../fronts/app/src/helpers/axios';

const uuid = ref();

onMounted(generate);
async function generate() {
  const { data: _uuid } = await axios.get('/uuid');
  uuid.value = _uuid;
}
</script>

<style scoped lang="scss">
.uuid-root,.section-content {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.section-content {
  align-items: center;
}

</style>
