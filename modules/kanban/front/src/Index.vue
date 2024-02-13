<template>
  <div class="uuid-root">
    <h1>Kanban</h1>
    <div class="section-content">
      <div class="boards-container">
        <input type="text" v-model="boardToCreate" @keypress.enter="createBoard" placeholder="New Board...">
        <div class="boards">
          <div class="board" :class="{active: selectedBoard?.id === board?.id}"
          v-for="board of boards" :key="board?.id" @click="router.push({query: {boardId: board?.id}})">
            {{ board?.name }}
            <button class="small" @click="deleteBoard(board)"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>

      <div class="columns" v-if="selectedBoard">
        <Column
          :board="selectedBoard" v-for="columnId of selectedBoard.columnIds" :key="columnId" :column-id="columnId"
          @refresh="refreshBoards()"
        ></Column>
        <div class="add-column" @click="createColumn"><i class="fas fa-plus"></i>New column</div>
      </div>
      <div v-else>Choose a board...</div>
    </div>
  </div>
  <Modal ref="deleteBoardModal" cancelString="No" validateString="Yes">
    <template #header="{data: board}">
      Delete {{board.name}}
    </template>
  </Modal>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '../../../../fronts/app/src/helpers/axios';
import Modal from '../../../../fronts/app/src/components/Modal.vue';
import Column from './Column.vue';

const route = useRoute();
const router = useRouter();

defineProps({
  plugin: {},
});
/** @type {import('vue').Ref<import('@clabroche/common-typings').NonFunctionProperties<import('../../backend/Kanban').BoardType>['prototype'][]>} */
const boards = ref([]);
/** @type {import('vue').Ref<import('@clabroche/common-typings').NonFunctionProperties<import('../../backend/Kanban').BoardType>['prototype'] | null>} */
const selectedBoard = ref();
const boardToCreate = ref('');
const deleteBoardModal = ref('');

watch(() => route.query.boardId, () => {
  selectedBoard.value = boards.value.find((b) => b?.id === route.query.boardId);
}, { immediate: true });

onMounted(reload);
async function refreshBoards() {
  const { data: _boards } = await axios.get('/kanban/boards');
  boards.value = _boards;
  selectedBoard.value = boards.value.find((b) => b?.id === route.query.boardId);
}
async function reload() {
  await refreshBoards();
}
/**
* @param {*} board
*/
async function deleteBoard(board) {
  // @ts-ignore
  deleteBoardModal.value.open(board).subscribe(async (/** @type {*} */res) => {
    if (!res) return;
    await axios.delete(`/kanban/boards/${board.id}`);
    await refreshBoards();
  });
}
async function createBoard() {
  if (boardToCreate.value) {
    await axios.post('/kanban/boards', { name: boardToCreate.value });
  }
  boardToCreate.value = '';
  await reload();
}

async function createColumn() {
  await axios.post(`/kanban/boards/${selectedBoard.value?.id}/columns`, {});
  await reload();
}
</script>

<style scoped lang="scss">
.uuid-root,.section-content {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.section-content {
  height: 100%;
}
.section-content,.columns {
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.columns {
  height: 100%;
  overflow: auto;
  .column {
    background-color: white;
    height: 100%;
  }
}

.board {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  box-sizing: content-box;
  &.active {
    border-left: 4px solid #0076bc;
    background-color: rgba(0,0,0,0.1);
  }
  &:hover {
    background-color: rgba(0,0,0,0.1);
    cursor: pointer;
  }
}

button.small {
  width: max-content;
  height: max-content;
  i {
    margin: 0;
  }
}

.add-column {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px dashed lightgrey;
  border-radius: 10px;
  color: darkgrey;
  padding: 10px;
  box-sizing: border-box;
}
</style>
