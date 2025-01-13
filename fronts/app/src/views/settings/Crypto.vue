<template>
  <SectionCmp header="Encryption">
    Key used to encrypt most of the data
    <div class="line">
      <Password v-model="newKey" :feedback="false" toggleMask style="width: 100%;" fluid
        @blur="saveKey"
        @keypress.enter="saveKey"
      ></Password>
      <Button icon="fas fa-refresh" @click="getNewKey"></Button>
    </div>
  </SectionCmp>

  <Modal ref="overrideModalRef" cancelString="Cancel" validateString="Ok">
    <template #header>
      Destructive
    </template>
    <template #body>
      Are you sure to replace the encryption key. Data like environments can be lost.
      <br>
      Save your data before.
    </template>
  </Modal>


  <Modal ref="wrongKeyModalRef" :no-cancel="true" validateString="Ok">
    <template #header>
      Wrong key
    </template>
    <template #body>
      It appears that Stack Monitor is already configured with an encryption key.
      <br>
      Please replace the existing key with the correct one to unlock the encrypted files.
    </template>
  </Modal>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import SectionCmp from '../../components/Section.vue';
import axios from '../../helpers/axios';
import Button from 'primevue/button';
import Password from 'primevue/password';
import notification from '../../helpers/notification';
import Modal from '../../components/Modal.vue';
import { useRouter } from 'vue-router';

const router = useRouter()
const key = ref('')
const newKey = ref('')
const overrideModalRef = ref()
const wrongKeyModalRef = ref()

onMounted(async() => {
  reload()
})
async function reload(noPopupCheckKey) {
  if(router.currentRoute.value.query.wrongKey && !noPopupCheckKey) wrongKeyModalRef.value.open()
  const {data: _key} = await axios.get('/crypto/encryption-key')
  key.value = _key
  newKey.value = _key
}
async function saveKey() {
  if(key.value === newKey.value) return
  const result = await overrideModalRef.value.open().promise
  if(!result) return reload(true)
  await axios.post('/crypto/encryption-key', {key: newKey.value})
      .then(() => notification.next('success', 'Key saved'))
      .catch(() => notification.next('error', 'Key cant be saved'));
  return reload(true)
}
async function getNewKey() {
  const result = await overrideModalRef.value.open().promise
  
  if(!result) return reload(true) 
  const {data: _key} = await axios.get('/crypto/generate-key')
  await axios.post('/crypto/encryption-key', {key: _key})
      .then(() => notification.next('success', 'Key saved'))
      .catch(() => notification.next('error', 'Key cant be saved'));
  return reload(true) 
}
</script>

<style lang="scss" scoped>
.line {
  display: flex;
  align-items: center;
}
</style>