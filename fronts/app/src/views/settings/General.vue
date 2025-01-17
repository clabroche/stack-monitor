<template>
  <SectionCmp header="Editor" :scroll="false">
    <div class="line">
      Default editor
      <CurrentEditor direction="right" :dark="true"></CurrentEditor>
    </div>
  </SectionCmp>

</template>

<script setup>
import SectionCmp from '../../components/Section.vue';
import CurrentEditor from '../../components/CurrentEditor.vue'
</script>

<style lang="scss" scoped>
.line {
  display: flex;
  align-items: center;
  gap: 20px;
}
</style>