
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import vscodeIcon from '@/assets/vscode-icon.svg'
import intellijIcon from '@/assets/intellij.svg'
import androidstudioIcon from '@/assets/androidstudio.svg'
import cursorIcon from '@/assets/cursor.svg'
import sublimeIcon from '@/assets/sublimetext.svg'
import Stack from '../models/stack'

function useCurrentEditor(service) {
  /** @type {import('vue').Ref<string[]>} */
  const availableEditors = ref([])
  const changeEditor = ref(0)
  const loading = ref(false)
  const allEditors = ref({
    code: {
      icon: vscodeIcon,
      title: 'Open in Visual Studio Code'
    },
    intellij: {
      icon: intellijIcon,
      title: 'Open in Intellij'
    },
    androidstudio: {
      icon: androidstudioIcon,
      title: 'Open in Android Studio'
    },
    cursor: {
      icon: cursorIcon,
      title: 'Open in Cursor'
    },
    sublime: {
      icon: sublimeIcon,
      title: 'Open in Sublime text'
    },
  })
  onMounted(async () => {
    try {
      loading.value = true
      availableEditors.value = await Stack.getAvailableEditors()
    } finally {
      loading.value = false
    }
  })
  const currentEditor = computed(() => {
    changeEditor.value
    let editor = service
      ? localStorage.getItem('default-editor-' + service?.label) || localStorage.getItem('default-editor') || ''
      : localStorage.getItem('default-editor') || ''
    if (!availableEditors.value.includes(editor)) editor = ''
    return {
      key: editor,
      ...allEditors.value[editor]
    }
  })
  function setDefaultEditor(editor) {
    if (service) localStorage.setItem('default-editor-' + service.label, editor)
    else localStorage.setItem('default-editor', editor)
    if (!localStorage.getItem('default-editor')) localStorage.setItem('default-editor', editor)
    changeEditor.value++
    location.reload()
  }
  return {
    availableEditors,
    loading,
    allEditors,
    currentEditor,
    setDefaultEditor,
  }
}
export { useCurrentEditor };
