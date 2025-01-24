<template>
  <div class="markdown">
    <div class="actions">
      <i class="fas fa-edit" v-if="!edit" @click="openEditMode"></i>
      <i class="fas fa-times" v-else @click="edit = false"></i>
    </div>
    <div class="sidebyside">
      <Textarea @blur="edit=false" v-if="edit" :value="localValue" @input="update($event.target.value)" autoResize />
      <div v-html="markdown"></div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue'
import markdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/monokai.min.css'
import Textarea from 'primevue/textarea'
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
const localValue = ref(props.modelValue)
const openEditMode = () => {
  localValue.value = props.modelValue
  edit.value = true
}
const emits = defineEmits(['update:modelValue'])
function update(value) {
  localValue.value = value
  emits('update:modelValue', value)
}
const markdown = computed(() => md.render(props.modelValue || ''))
</script>

<style lang="scss" scoped>
.markdown {
  position: relative;
}
.actions {
  display: flex;
  justify-content: flex-end;
  position: absolute;
  right: 0;
  i {
    font-size: 1.2rem;
    cursor: pointer;
    padding: 10px;
  }
}
.sidebyside {
  display: flex;
  gap: 5px;
  textarea {
    width: 50%;
  }
}
</style>