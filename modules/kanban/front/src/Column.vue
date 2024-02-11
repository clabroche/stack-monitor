<template>
  <div class="column-root" v-if="column">
    <div class="column-header">
      <h2>
        <input class="invisible" type="text" v-model="column.name"
          @focusout="saveColumn"
          @keypress.enter="saveColumn"
          placeholder="Name of column..."
          @input="resizeInput"
        >
      </h2>
      <div class="actions">
        <button class="small" @click.stop="deleteColumn(column)"><i class="fas fa-trash"></i></button>
      </div>
    </div>
    <div class="cards">
      <div class="add-card" @click="openCreateModal()"><i class="fas fa-plus"></i>Create a card</div>
      <draggableComponent
        v-model="cards"
        group="column"
        @start="drag=true"
        @end="drag=false"
        @change="saveColumn"
        class="droppable"
        item-key="id">
        <template #item="{element: card}">
          <div class="card" @click="openCreateModal(card)" >
            {{ card.name }}
            <button class="small" @click.stop="deleteCard(card)"><i class="fas fa-trash"></i></button>
          </div>
        </template>
      </draggableComponent>
    </div>
  </div>

  <Modal ref="createCardModal" cancelString="No" validateString="Yes">
    <template #header="{data: card}">
      {{card?.id ? 'Update card' : 'Create card'}}
    </template>
    <template #body="{data: card}">
      <div class="input-container">
        <label>Nom</label>
        <input type="text" placeholder="Nom..." v-model="card.name">
      </div>

      <div class="input-container">
        <label>Description</label>
        <textarea placeholder="Description..." v-model="card.description"></textarea>
      </div>

    </template>
  </Modal>

  <Modal ref="deleteCardModal" cancelString="No" validateString="Yes">
    <template #header="{data: card}">
      Delete {{card.name}}
    </template>
  </Modal>
  <Modal ref="deleteColumnModal" cancelString="No" validateString="Yes">
    <template #header="{data: column}">
      Delete {{column.name}}
    </template>
  </Modal>
</template>

<script setup>
import Modal from '@clabroche/fronts-app/src/components/Modal.vue';
import axios from '@clabroche/fronts-app/src/helpers/axios';
import { cloneDeep } from 'lodash';
import { ref, onMounted, watch } from 'vue';
import draggableComponent from 'vuedraggable';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

/**
 * @param {Event} $ev
 */
function resizeInput($ev) {
  // eslint-disable-next-line prefer-destructuring
  const target = /** @type {HTMLInputElement} */($ev.target);
  if (!target) return;
  target.style.width = `${target.value.length}em`;
}

const props = defineProps({
  board: {
    required: true,
    type: null,
  },
  columnId: {
    required: true,
    type: String,
  },
});
/** @type {import('vue').Ref<InstanceType<typeof Modal> | null>} */
const createCardModal = ref(null);
/** @type {import('vue').Ref<InstanceType<typeof Modal> | null>} */
const deleteCardModal = ref(null);
/** @type {import('vue').Ref<InstanceType<typeof Modal> | null>} */
const deleteColumnModal = ref(null);
const drag = ref(false);
/** @type {import('vue').Ref<InstanceType<import('../../backend/Kanban').CardType>[]>} */
const cards = ref([]);
/** @type {import('vue').Ref<import('@clabroche/common-typings').NonFunctionProperties<import('../../backend/Kanban').ColumnType>['prototype'] | undefined | null>} */
const column = ref();

watch(() => route.query.cardId, () => {
  if (!route.query.cardId) return;
  const card = cards.value.find((b) => b?.id === route.query.cardId);
  if (card) openCreateModal(card);
}, { immediate: true });

onMounted(async () => {
  await refreshColumn();
  refreshCards();
});

/** @param {import('../../backend/Kanban').CardType['prototype']} card */
async function deleteCard(card) {
  deleteCardModal.value?.open(card).subscribe(async (res) => {
    if (!res) return;
    await axios.delete(`/kanban/boards/${props.board.id}/columns/${props.columnId}/cards/${card.id}`);
    await refreshColumn();
    await refreshCards();
  });
}

/** @param {import('../../backend/Kanban').ColumnType['prototype']} column */
async function deleteColumn(column) {
  deleteColumnModal.value?.open(column).subscribe(async (res) => {
    if (!res) return;
    await axios.delete(`/kanban/boards/${props.board.id}/columns/${props.columnId}/`);
    await refreshColumn();
    await refreshCards();
  });
}
async function refreshColumn() {
  const { data: _column } = await axios.get(`/kanban/boards/${props.board.id}/columns/${props.columnId}`);
  column.value = _column;
}
async function refreshCards() {
  const { data: _cards } = await axios.get(`/kanban/boards/${props.board.id}/columns/${props.columnId}/cards`);
  cards.value = _cards;
  const card = cards.value.find((b) => b?.id === route.query.cardId);
  if (card) openCreateModal(card);
}
/** @param {import('../../backend/Kanban').CardType['prototype'] | Record<any, any>} card */
async function openCreateModal(card = {}) {
  card = cloneDeep(card);
  if (card.id) {
    router.push({ query: { ...route.query, cardId: card.id } });
  }
  createCardModal.value?.open(card).subscribe(async (res) => {
    router.push({ query: { ...route.query, cardId: undefined } });
    if (!res) return;
    await axios.post(`/kanban/boards/${props.board.id}/columns/${props.columnId}/cards`, card);
    await refreshColumn();
    await refreshCards();
  });
}

/**
 *
 * @param {KeyboardEvent | FocusEvent} $ev
 */
async function saveColumn($ev) {
  // eslint-disable-next-line prefer-destructuring
  const target = /** @type {HTMLElement} */($ev.target);
  if (target) target.blur();
  if (column.value?.cardIds) column.value.cardIds = cards.value.map((c) => c.id);
  await axios.post(`/kanban/boards/${props.board.id}/columns/`, column.value);
  await refreshColumn();
}
</script>

<style scoped lang="scss">
.column-root,.section-content {
  display: flex;
  flex-direction: column;
  width: 300px;
  background-color: white;
  padding: 10px;
  box-sizing: border-box;
  border-radius: 10px;
}
.column-root {
  height: calc(100% - 100px);
  &:hover {
    .actions {
      display: flex;
    }
  }
}
.section-content {
  display: flex;
  flex-direction: row;
  gap: 10px;
}

button.small {
  width: max-content;
  height: max-content;
  i {
    margin: 0;
  }
}
.column-header {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  display: flex;
  justify-content: space-between;
  h2 {
    margin: 0;
  }
}
.cards {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 10px;
  overflow: auto;
  .card {
    border-radius: 10px;
    box-shadow: 0 0 3px 2px rgba(0,0,0,0.1);
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;

    transition: 300ms;
  will-change: transform;
  &:hover {
    transform: scale(1.05);
    background-color: #0076bc;
    color: white;
  }
  }
}
.add-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px dashed lightgrey;
  border-radius: 10px;
  color: darkgrey;
  padding: 10px;
  box-sizing: border-box;
  cursor: pointer;
  transition: 300ms;
  will-change: transform;
  &:hover {
    transform: scale(1.05);
    background-color: #0076bc;
    color: white;
  }
}

.invisible {
  border: none;
  font-size: inherit;
  font-weight: inherit;
  width: max-content;
  box-sizing: border-box;
  padding: 0;
  outline: none;
}

.input-container {
  display: flex;
  flex-direction: column;
}
.actions {
  display: none;
  position: absolute;
  right: 0;
}
.droppable {
  flex-grow: 1;
  gap: 10px;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 1px 9px;
}
</style>
