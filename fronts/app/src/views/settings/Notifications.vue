<template>
  <Tabs :value="tab" @update:value="changeTab($event)">
      <TabList>
          <Tab :value="tab.key" v-for="tab of tabs">{{tab.label}}</Tab>
      </TabList>
  </Tabs>
  <div class="sections">
    <SectionCmp header="All">
      <div class="line">
        <div class="actions">
          <Button :severity="mutedNotifications[tab]['MUTED_ALL'] ? 'danger' : 'secondary'" icon="fas fa-bell-slash" @click="mute('MUTED_ALL')"></Button>
          <Button :severity="mutedNotifications[tab]['MUTED_ALL'] ? 'secondary' : 'success'" icon="fas fa-bell" @click="unmute('MUTED_ALL')"></Button>
        </div>
        All
      </div>
    </SectionCmp>
    <SectionCmp header="By services">
      <div class="services">
        <div v-for="service of Stack.services.value">
          <h4>{{service.label}}</h4>
          <div class="commands">
            <div v-for="command of service.commands" class="command">
              <div class="actions">
                <Button :severity="mutedNotifications[tab].MUTED_ALL || mutedNotifications[tab][command.id] ? 'danger' : 'secondary'" icon="fas fa-bell-slash" @click="mute(command.id)"></Button>
                <Button :severity="mutedNotifications[tab].MUTED_ALL || mutedNotifications[tab][command.id] ? 'secondary' : 'success'" icon="fas fa-bell" @click="unmute(command.id)"></Button>
              </div>
              {{command.spawnCmd}} {{command.spawnArgs?.join(' ') || ''}}
            </div>
          </div>
        </div>
      </div>
    </SectionCmp>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import SectionCmp from '../../components/Section.vue';
import Button from 'primevue/button';
import Stack from '../../models/stack';
import notification from '../../helpers/notification';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
const tab =ref('')
const tabs =ref([{
  label: 'Hide errors',
  key: 'error',
}])
const mutedNotifications = notification.mutedNotifications

function changeTab(_tab) {
  if(!mutedNotifications.value[_tab]) mutedNotifications.value[_tab] = {}
  tab.value = _tab
}
changeTab('error')
function mute(label) {
  mutedNotifications.value[tab.value][label] = true
}
function unmute(label) {
  delete mutedNotifications.value[tab.value][label]
}

</script>

<style lang="scss" scoped>
.line {
  display: flex;
  align-items: center;
  gap: 10px
}
h2,h4 {
  margin: 0
}
.command {
  display: flex;
  align-items: center;
  gap: 10px
}
.services {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.actions {
  display: flex;
  gap: 3px;
  Button  {
    font-size: 0.5rem;
    width: 25px;
    height: 25px;
    margin: 0
  }
}
.commands {
  display: flex;
  flex-direction: column;
  gap: 2px
}
.sections {
  display: flex;
  flex-direction: column;
  gap: 20px
}
</style>