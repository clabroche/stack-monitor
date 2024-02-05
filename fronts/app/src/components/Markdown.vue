<template>
  <i class="fas fa-edit" v-if="!edit" @click="edit = true"></i>
  <i class="fas fa-times" v-else @click="edit = false"></i>
  <div class="sidebyside">
    <textarea v-if="edit" :value="modelValue" @input="update($event.target.value)"></textarea>
    <div v-html="markdown"></div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue'
import markdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/monokai.min.css'

const md = markdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre><code class="hljs">' +
              hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
              '</code></pre>';
      } catch (__) {}
    }
    return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
  }
})
const edit = ref(false)
const props = defineProps({
  modelValue: {default: ''}
})
const emits = defineEmits(['update:modelValue'])
function update(value) {
  emits('update:modelValue', value)
}
const markdown = computed(() => md.render(props.modelValue || ''))
</script>

<style lang="scss" scoped>
.sidebyside {
  display: flex;
  gap: 5px;
  textarea {
    width: 50%;
  }
}
</style>