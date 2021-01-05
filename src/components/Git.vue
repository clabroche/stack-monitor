<template>
  <sections-container header="Git">
    <div class="git-section" v-if="currentService.git && currentService.git.remote">
      <section-cmp v-if="git.branches" :key="currentService.label" header="Branches">
        <ul class="branches">
          <li v-for="(branch, i) of git.branches" :key="'branch' +i" @click="changeBranch(branch)" :class="{active: branch.includes('*')}">
            {{branch.replace(/^\* /gm, '')}} <i class="fas fa-chevron-right"  aria-hidden="true"></i>
          </li>
        </ul>
      </section-cmp>
      <section-cmp v-if="git.status" header="Status" :actions="[{label: 'Reset', click: () => reset(), icon: 'fas fa-eraser'}]">
        <ul v-if="git.status.filter(a =>a).length">
          <li v-for="(status, i) of git.status" :key="'status-' + i" @click="checkoutFile(status)">
            <span v-html="colorStatus(status)"></span>
            <i class="fas fa-times" aria-hidden="true"></i>
          </li>
        </ul>
        <div v-else class="check">
          <i class="fas fa-check" aria-hidden="true"></i>
        </div>
      </section-cmp>
    </div>
    <modal ref="reset-modal" cancelString="No" validateString="Yes">
      <div slot="header">
        Reset
      </div>
      <div slot="body">
        Do you really want to launch "git reset --hard" on this repository ?
      </div>
    </modal>
    <modal ref="checkout-modal" cancelString="No" validateString="Yes">
      <div slot="header">
        Checkout
      </div>
      <div slot="body" slot-scope="{data: file}">
        Do you really want to launch "git checkout {{file}}" on this repository ?
      </div>
    </modal>
    <modal ref="branch-modal" cancelString="No" validateString="Yes">
      <div slot="header">
        Branch change
      </div>
      <div slot="body" slot-scope="{data: branchName}">
        Do you really want to change branch to "{{branchName}}" on this repository ?
      </div>
    </modal>
    <modal ref="error-modal" :noActions="true">
      <div slot="header">
        Erreur
      </div>
      <div slot="body" slot-scope="{data: error}" v-html="error ? error.replace(/\n/gi, '<br/>') : ''">
      </div>
    </modal>
  </sections-container>
  
</template>

<script>
import Service from '../models/service'
import stack from '../models/stack'
import ModalVue from './Modal.vue'
import SectionVue from './Section.vue'
import SectionsContainerVue from './SectionsContainer.vue'
export default {
  components: {
    sectionsContainer: SectionsContainerVue,
    sectionCmp: SectionVue,
    modal: ModalVue
  },
  props: {
    currentService: {
      /** @type {import('../models/service').default}*/
      default: null,
      required: true,
      type: Service
    },
  },
  data() {
    return {
      git: {
        branches: [],
        status: [],
      },
    }
  },
  watch: {
    async '$route.params.label'() {
      this.currentService = await stack.getService(this.$route.params.label)
    }
  },
  async mounted() {
    await this.updateGit()
  },
  methods: {
    colorStatus(status) {
      status = status.trim()
      if(status.charAt(0) === 'D') {
        status = '<span style="color: #ff7f7f; font-weight: bold">D</span>' + status.slice(1) 
      }
      if(status.charAt(0) === 'M') {
        status = '<span style="color: #ffe47f; font-weight: bold">M</span>' + status.slice(1) 
      }
      if(status.charAt(0) === '?') {
        status = '<span style="color: #7fe1ff; font-weight: bold">??</span>' + status.slice(2) 

      }
      return status
    },
    async updateGit() {
      this.git.branches = await this.currentService.getBranches(this.currentService.label)
      this.git.status = await this.currentService.getStatus(this.currentService.label)
    },
    async changeBranch(branchName) {
      branchName = branchName.trim()
      const res = await this.$refs['branch-modal'].open(branchName).promise
      if(res) {
        await this.currentService.changeBranch(branchName)
          .catch(err => {
            return this.$refs['error-modal'].open(err.response.data).promise
          })
      }
    },
    async checkoutFile(fileStatus) {
      const file = fileStatus.split(' ').slice(1).join(' ')
      const res = await this.$refs['checkout-modal'].open(file).promise
      if(res) {
        return this.currentService.checkoutFile(file)
      }
    },
    async reset() {
      const res = await this.$refs['reset-modal'].open().promise
      if(res) {
        return this.currentService.reset()
      }
    },
  }
}
</script>

<style lang="scss" scoped>
.git-section {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  margin: auto;
  max-height: 240px;
  overflow: hidden;
  &>div {
    &:first-of-type {
      margin-right: 5px
    }
    &:last-of-type {
      margin-left: 5px
    }
  }
  .check {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    font-size: 1.5em;
    color: green;
  }
  ul {
    margin: 0;
    padding: 0;
    li {
      border-left: 1px solid lightgrey;
      padding: 0;
      padding-left: 10px;
      transition: 300ms;
      display: flex;
      justify-content: space-between;
      align-items: center;
      list-style: none;
      margin: 0;
      cursor: pointer;
      &.active {
        border-left: 3px solid #0076bc;
      }
      i {
        transition: 300ms;
        opacity: 0;
        margin: 0 3px
      }
      &:hover {
        background-color: rgba(0,0,0,0.05);
        i {
          opacity: 1;
        }
      }
    }
  }
}
</style>