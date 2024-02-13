<template>
  <div class="finder-root" v-show="show" @click="show = false" :class="{isComponent}">
    <div class="hint" v-if="isComponent">
      Press Ctrl+Alt+P To open it anywhere
    </div>
    <div class="finder-container" @click.stop="">
      <input type="text" autofocus v-model="search"
        placeholder="Type to find something..." ref="inputRef" @keyup="keyup">
      <div class="groups">
        <SectionCmp class="group" v-for="group of displayedGroups" :key="`${group}`">
          <h2>{{ group.label }}</h2>
          <div class="choices">
            <div class="choice" v-for="choice of group.choices" :key="`${choice}`"
              :class="{active: choice.active}" @click.stop="validate(choice)">
              <div class="left">
                <div class="icon">
                  <i :class="choice.icon || 'fas fa-cog'"></i>
                </div>
                <div>
                  <div class="title">
                    {{ choice.title }}
                  </div>
                  <div class="description">
                    {{ choice.description }}
                  </div>
                </div>
              </div>
              <div class="right">
                <div class="title">
                  {{ choice.secondaryTitle }}
                </div>
                <div class="description">
                  {{ choice.secondaryDescription }}
                </div>
              </div>
            </div>
            <div class="choice" @click.stop="">
              <div class="left">
                <div v-if="group.otherChoices?.length">
                  <div class="title">And {{group.otherChoices.length}} others...</div>
                  <div class="description">
                    {{ group
                      .otherChoices
                      .map(a => a.title)
                      .slice(0, 20)
                      .map(a => a.slice(0, 40) + '...')
                      .join(', ')
                    }} ...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCmp>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed, nextTick, onBeforeUnmount, onMounted, ref, watch,
} from 'vue';
import debounce from 'debounce';
import { useRouter } from 'vue-router';
import axios from '../../../../fronts/app/src/helpers/axios';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';

const router = useRouter();

/** @param {KeyboardEvent} e */
const listener = async (e) => {
  if (e.ctrlKey && e.altKey && e.code === 'KeyP') {
    e.preventDefault();
    show.value = !show.value;
    search.value = '';
    await nextTick();
    inputRef.value.focus();
  }
  if (e.code === 'Escape') {
    e.preventDefault();
    show.value = false;
  }
};

window.addEventListener('keyup', listener);
onBeforeUnmount(() => window.removeEventListener('keyup', listener));

/** @type {import('vue').Ref<Record<string, {label: string, otherChoices: FinderChoice[], choices: FinderChoice[]}>>} */
const groups = ref({});
const search = ref('');
const inputRef = ref();
const show = ref(false);

const isComponent = computed(() => router.currentRoute.value.path.includes('/Finder'));

watch(() => show.value, () => {
  if (isComponent.value) show.value = true;
}, { immediate: true });

const displayedGroups = computed(() => Object.keys(groups.value).map((key) => {
  const group = groups.value[key];
  return {
    label: group.label,
    choices: group.choices?.slice(0, 4),
    otherChoices: group.choices?.slice(4, group.choices?.length),
  };
}));

async function reload() {
  const { data: _choices } = await axios.get('/finder/search', { params: { q: search.value } });
  /** @type {Record<string, {label: string, otherChoices: FinderChoice[], choices: FinderChoice[]}>} */
  const res = {};
  if (_choices[0]) _choices[0].active = true;
  _choices.map((/** @type {FinderChoice} */ choice) => {
    if (!choice.group) choice.group = 'Others';
    if (!res[choice.group]) res[choice.group] = { label: choice.group, choices: [], otherChoices: [] };
    res[choice.group].choices.push(choice);
    return null;
  });
  groups.value = res;
}
onMounted(reload);
watch(() => search.value, debounce(reload, 200));

/** @param {FinderChoice | undefined} choice */
function validate(choice) {
  if (choice?.url) {
    router.push(choice.url);
    show.value = false;
  }
}

/** @param {KeyboardEvent} $event */
async function keyup($event) {
  const choices = displayedGroups.value.flatMap((group) => group.choices);
  if (['ArrowUp', 'ArrowDown'].includes($event.code)) {
    for (let i = 0; i < choices.length; i += 1) {
      const choice = choices[i];
      if (choice.active) {
        choice.active = false;
        const fallback = $event.code === 'ArrowUp' ? choices[choices.length - 1] : choices[0];
        const previous = ($event.code === 'ArrowUp' ? choices[i - 1] : choices[i + 1]) || fallback;
        previous.active = true;
        break;
      }
    }
  }
  if ($event.code === 'Enter') {
    validate(choices.find((choice) => choice.active));
  }
}

/**
 * @typedef {(import('../../backend/routes').FinderChoice & {active?: boolean })} FinderChoice
 */
</script>

<style lang="scss" scoped>

.finder-root {
  position: fixed;
  z-index: 100000000000;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  background-color: rgba(0,0,0,0.2);
  .hint {
    margin: 10px;
    background-color: white;
    border: 1px solid #bdbdbd;
    box-sizing: border-box;
    border-radius: 10px;
    padding: 5px;
  }
  &.isComponent {
    position: relative;
    justify-content: flex-start;
    height: calc(100vh);
    .finder-container {
      height: auto;
      flex-grow: 1;
      .groups {
        max-height: inherit;
      }
    }
  }
  .finder-container {
    overflow: auto;
    width: 90%;
    border-radius: 10px;
    max-width: 1000px;
    height: max-content;
    background-color: white;
    border: 1px solid #bdbdbd;
    padding: 10px;
    box-sizing: border-box;
    input {
      width: 100%;
      margin-bottom: 10px;
    }
    .choices {
      display: flex;
      flex-direction: column;
      .choice {
        display: flex;
        justify-content: space-between;
        padding: 2px 5px;
        box-sizing: border-box;
        border: 2px solid transparent;
        border-radius: 10px;
        cursor: pointer;
        &:hover {
          background-color: rgba(0,0,0,0.1);
        }
        &.active {
          border-left-color:#0076bc
        }
        .left {
          display: flex;
          align-items: center;
          .icon {
            flex-shrink: 0;
            width: 30px;
          }
        }
        .right {
          flex-shrink: 0;
          text-align: right;
        }
        .title {
          font-size: 1.02em;
        }
        .description {
          font-size: 0.8em;
          color: #777;
        }
      }
    }
  }
}
.groups {
  display: flex;
  flex-direction: column;
  overflow: auto;
  max-height: 50vh;
  gap: 20px;
  h2 {
    margin: 0;
  }
}
</style>
