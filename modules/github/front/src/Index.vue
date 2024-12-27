<template>
  <section-cmp v-if="service" :key="service.label">
    <div class="header">
      <h2>Github</h2>
    </div>
    <div class="container" v-if="isReady">
      <div>
        Logged as:
        {{ loggedAs }}
      </div>
      <div class="chooser" v-if="!currentPr">
        <div>
          <input type="checkbox" v-model="onlyToReview">
          Display only to review
        </div>
        <div>
          <input type="checkbox" v-model="onlyOwned">
          Display only owned
        </div>
        <TableGeneric :headers="[
          { id: 'state', label: 'State', width: '70px', },
          { id: 'title', label: 'Title' },
          { id: 'assignees', label: 'Owner',width: '100px', },
          { id: 'requested_reviewers', label: 'Reviewers', width: '100px', }
        ]" :value="prToDisplay" @row-click="currentPr = $event.row">
          <template #assignees="{item: assignees}">
            <div class="avatars">
              <img v-for="user of assignees" class="avatar"
              :src="user.avatar_url" :alt="user.login" :title="user.login">
            </div>
          </template>
          <template #requested_reviewers="{item: requested_reviewers }">
            <div class="avatars">
              <img v-for="user of requested_reviewers" class="avatar"
              :src="user.avatar_url" :alt="user.login" :title="user.login">
            </div>
          </template>
        </TableGeneric>
      </div>
      <div class="content" v-if="currentPr">
        <div @click="currentPr = null">
          <i class="fas fa-chevron-left"></i>
          Return
        </div>
        <h2>{{ currentPr.title }}</h2>
        <div class="section">
          <h3><i class="fas fa-globe"></i>Urls</h3>
          <ul>
            <li><a :href="currentPr.html_url">Home url</a></li>
            <li><a :href="currentPr.diff_url">Diff url</a></li>
            <li><a :href="currentPr.comments_url">Comment url</a></li>
          </ul>
        </div>
        <div class="section">
          <h3><i class="fas fa-users"></i>Assignees</h3>
          <ul>
            <li v-for="user of currentPr.assignees" class="avatars">
              <a :href="user.html_url">
                <img class="avatar" :src="user.avatar_url" alt=""/>{{ user.login }}
              </a>
            </li>
          </ul>
        </div>
        <div class="section">
          <h3><i class="fas fa-users"></i>Reviewers</h3>
          <ul>
            <li v-for="user of currentPr.requested_reviewers" class="avatars">
              <a :href="user.html_url">
                <img class="avatar" :src="user.avatar_url" alt=""/>{{ user.login }}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="container" v-else>
      <div>
        To use this module you need to provide a valid apikey from github in the
        STACK_MONITOR_GH_APIKEY environment variable.
        <a href="https://github.com/settings/tokens/new" target="_blank">See here.</a>
      </div>
    </div>
  </section-cmp>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import Service from '../../../../fronts/app/src/models/service';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
import axios from '../../../../fronts/app/src/helpers/axios';
import notification from '../../../../fronts/app/src/helpers/notification';
import TableGeneric from '../../../../fronts/app/src/components/TableGeneric.vue';

const props = defineProps({
  service: {
    default: null,
    required: true,
    type: Service,
  },
});

const apikey = ref('');
const onlyToReview = ref(false);
const onlyOwned = ref(false);
const isReady = ref(false);
const loggedAs = ref('');
/** @type {import('vue').Ref<PR[]>} */
const prs = ref([]);
/** @type {import('vue').Ref<PR | null>} */
const currentPr = ref(null);
onMounted(async () => {
  await reload();
});

async function getIsReady() {
  const { data: _isReady } = await axios.get(`/github/service/${props.service.label}/ready`);
  return !!_isReady;
}

async function getLoggedAs() {
  const { data: login } = await axios.get(`/github/service/${props.service.label}/whoami`);
  return login.loggedAs;
}
async function getPRs() {
  const { data: prs } = await axios.get(`/github/service/${props.service.label}/pull-requests`);
  return prs;
}
async function reload() {
  try {
    isReady.value = await getIsReady();
    if (!isReady.value) return;
    loggedAs.value = await getLoggedAs();
    prs.value = await getPRs();
  } catch (error) {
    notification.next('error', 'Something not works');
    console.error(error);
  }
}

const prToDisplay = computed(() => {
  let res = prs.value;
  if (onlyToReview.value) {
    res = res.filter((pr) => (
      pr.requested_reviewers.find((user) => user.login === loggedAs.value)
    ));
  }
  if (onlyOwned.value) res = res.filter((pr) => pr.assignees.find((user) => user.login === loggedAs.value));
  return res;
});

async function validateApikey() {
  await axios.post(`/github/service/${props.service.label}/apikey`, { apikey: apikey.value })
    .catch((err) => {
      notification.next('error', err?.response?.data || err?.message || err);
    });
  apikey.value = '';
  await reload();
}
/**
 * @typedef {{
 *  url: string,
 *  id: number,
 *  node_id: string,
 *  html_url: string,
 *  diff_url: string,
 *  patch_url: string,
 *  issue_url: string,
 *  number: number,
 *  state: string,
 *  locked: boolean,
 *  title: string,
 *  user: {
 *   login: string,
 *   id: number,
 *   node_id: string,
 *   avatar_url: string,
 *   gravatar_id: string,
 *   url: string,
 *   html_url: string,
 *   followers_url: string,
 *   following_url: string,
 *   gists_url: string,
 *   starred_url: string,
 *   subscriptions_url: string,
 *   organizations_url: string,
 *   repos_url: string,
 *   events_url: string,
 *   received_events_url: string,
 *   type: string,
 *   site_admin: boolean
 *  },
 *  body: string,
 *  created_at: string,
 *  updated_at: string,
 *  closed_at: string,
 *  merged_at: string,
 *  merge_commit_sha: string,
 *  assignee: string,
 *  assignees: {
 *    login: string,
 *    id: number,
 *    node_id: string,
 *    avatar_url: string,
 *    gravatar_id: string,
 *    url: string,
 *    html_url: string,
 *    followers_url: string,
 *    following_url: string,
 *    gists_url: string,
 *    starred_url: string,
 *    subscriptions_url: string,
 *    organizations_url: string,
 *    repos_url: string,
 *    events_url: string,
 *    received_events_url: string,
 *    type: string,
 *    site_admin: boolean
 *  }[],
 *  requested_reviewers:  {
 *    login: string,
 *    id: number,
 *    node_id: string,
 *    avatar_url: string,
 *    gravatar_id: string,
 *    url: string,
 *    html_url: string,
 *    followers_url: string,
 *    following_url: string,
 *    gists_url: string,
 *    starred_url: string,
 *    subscriptions_url: string,
 *    organizations_url: string,
 *    repos_url: string,
 *    events_url: string,
 *    received_events_url: string,
 *    type: string,
 *    site_admin: boolean
 *  }[],
 *  requested_teams: string[],
 *  labels: {
 *    id: number,
 *    node_id:string,
 *    url:string,
 *    name:string,
 *    color:string,
 *    default: boolean,
 *    description: string
 *  }[],
 *  milestone: string,
 *  draft: boolean,
 *  commits_url: string,
 *  review_comments_url: string,
 *  review_comment_url: string,
 *  comments_url: string,
 *  statuses_url: string,
 *  head: {
 *    label: string,
 *    ref: string,
 *    sha: string,
 *  },
 *  base: {
 *    label: string,
 *    ref: string,
 *    sha: string,
 *  },
 * _links: {
 *    self: {
 *      href: string
 *    },
 *    html: {
 *      href: string
 *    },
 *    issue: {
 *      href: string
 *    },
 *    comments: {
 *      href: string
 *    },
 *    review_comments: {
 *      href: string
 *    },
 *    review_comment: {
 *      href: string
 *    },
 *    commits: {
 *      href: string
 *    },
 *    statuses: {
 *      href: string
 *    }
 *  },
 * }} PR
 */
</script>
<style lang="scss" scoped>
h2,
h3 {
  margin: 0;
  display: flex;
  gap: 10px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chooser {
  .avatars {
    display: flex;
    flex-direction: row;
    .avatar {
      width: 30px;
      height: 30px;
      object-fit: cover;
      border-radius: 50%;
    }
  }
}
.content {
  .avatars>a {
    display: flex;
    align-items: center;
    gap: 10px;
    .avatar {
      width: 30px;
      height: 30px;
      object-fit: cover;
      border-radius: 50%;
    }
  }
}
ul {
  margin: 0;
}
</style>
