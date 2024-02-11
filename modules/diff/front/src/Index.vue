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
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
</script>

<style scoped lang="scss">
.diff-root,.section-content {
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>
