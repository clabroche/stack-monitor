<template>
    <section-cmp class="stack-chooser" v-if="servicesToLaunch" header="Choose all services to launch">
        <div class="groups">
        <div v-for="(group) of groups" :key="group.label">
            <div class="group-header" @click="group.show = !group.show">
            <div class="left-header">
                <i class="fas fa-chevron-down" v-if="group.label !== 'All'" aria-hidden="true"></i>
                <h3>{{ group.label }} <span>({{ group.services?.length }})</span></h3>
            </div>
            <div class="right-header" >
                <button @click.stop="toggleGroup(group.label)" class="mini">
                <i class="far fa-check-square" v-if="isGroupSelected(group.label)" aria-hidden="true"></i>
                <i class="far fa-square" v-else aria-hidden="true"></i>
                </button>
            </div>
            </div>
            <ul v-if="group.show || group.label === 'All'">
            <input type="text" v-model="search" @keypress.enter="toggleService(servicesToLaunch.find(f => f.label === displayedServices(group.services)[0]?.label))" placeholder="Type+Enter to toggle..." >
            <li v-for="service of displayedServices(group.services)" :key="'services-' + service.label">
                <input
                type="checkbox"
                :id="'input-' + service.label"
                :value="servicesToLaunch.find(f => f.label === service.label)?.enabled"
                :checked="servicesToLaunch.find(f => f.label === service.label)?.enabled"
                @change="toggleService(servicesToLaunch.find(f => f.label === service.label))">
                <label :for="'input-' + service.label">
                {{ service.label }}
                </label>
            </li>
            </ul>
        </div>
        </div>
        <div class="actions">
        <button v-if="!isAllEnabled" @click="toggleGroup('All')">Select all</button>
        <button v-else @click="toggleGroup('All')">Unselect all</button>
        <button @click="validate" class="success"><i class="fas fa-play" aria-hidden="true"></i> Launch</button>
        </div>
    </section-cmp>
</template>


<script>
import Stack from '../models/stack'
import System from '../models/system'
import SectionVue from '../components/Section.vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import BackgroundStackChooser from '../components/BackgroundStackChooser.vue'
import LeftLogo from '../components/LeftLogo.vue'
import { useRouter } from 'vue-router';

export default {
    name: 'StackChooser',
    components: {
        sectionCmp: SectionVue,
        BackgroundStackChooser,
        LeftLogo
    },
    props: {
        embed: { default: false },
    },
    setup() {
        const router = useRouter();
        /** @type {import('vue').Ref<{label: string | undefined, enabled: boolean, groups: string[] | undefined}[]>} */
        const servicesToLaunch = ref([])
        onMounted(async () => {
            await Stack.loadServices()
            servicesToLaunch.value = Stack.services.value.map(service => {
                const state = localStorage.getItem(`automatic-toggle-${service.label}`)
                return {
                    label: service.label,
                    enabled: state === 'true' || service.enabled || false,
                    groups: service.groups
                }
            })
        })

        const validate = async () => {
            servicesToLaunch.value.forEach((s) => {
                const service = Stack.services.value.find(_s => _s.label === s.label)
                if (!service) return
                service.enabled = s.enabled
            })
            Stack.launchServices(servicesToLaunch.value.map(s => ({label: s.label, enabled: s.enabled})))
            const enabledServices = await Stack.getEnabledServices()
            router.push({ name: 'stack-single', params: { label: enabledServices[0]?.label || Stack.services.value[0]?.label } })
        }
        /** @param {string} group */
        const getServicesFromGroup = group => servicesToLaunch.value.filter(service => service.groups?.includes(group) || group === 'All')
        /** @param {string} group */
        const isGroupSelected = group => getServicesFromGroup(group).every(service => service.enabled)
        const search = ref('')

        /** @param {typeof servicesToLaunch['value'][number] | undefined} service */
        const save = async (service) => {
            if (!service?.label) return
            localStorage.setItem(`automatic-toggle-${service.label}`, service.enabled == null ? 'false' : service.enabled.toString())
        }
        /**
         * @param {typeof servicesToLaunch['value'][number] | undefined} service
         * @param {boolean | null} force
         */
        const toggleService = async (service, force = null) => {
            if (service != null) {
                service.enabled = force != null ? force : !service.enabled
                await save(service)
            }
        }
        return {
            servicesToLaunch,
            search,
            isAllEnabled: computed(() => servicesToLaunch.value.every(service => service.enabled)),
            groups: computed(() => {
                const groupsById = servicesToLaunch.value.reduce((groups, service) => {
                    if (service.groups) {
                        service.groups.forEach(group => {
                            if (!groups[group]) groups[group] = reactive({ services: [], label: group })
                            groups[group].services.push(service)
                        });
                    }

                    if (!groups['All']) groups['All'] = reactive({ services: [], label: "All" })
                    groups['All'].services.push(service)

                    return groups
                }, /**@type {Record<string, {label: string, services: typeof servicesToLaunch['value'][number][], show?: boolean}>}*/({}))
                return Object.keys(groupsById).map(key => groupsById[key]).sort((a, b) => a.label.localeCompare(b.label))
            }),
            /** @param {string} group */
            toggleGroup(group) {
                const groupSelected = isGroupSelected(group)
                getServicesFromGroup(group).map(service => {
                    toggleService(service, !groupSelected)
                })
            },
            save,
            isGroupSelected,
            Stack,
            System,
            validate,
            /** @param {typeof servicesToLaunch['value'][number][]} services */
            displayedServices(services) {
                return services.filter(s => s.label?.toUpperCase().includes(search.value.toUpperCase()))
            },
            toggleService,
        }
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
    h3 {
        margin: 0;

        span {
            color: #8e8e8e;
            font-weight: normal;
        }
    }

    .group-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 10px;
        cursor: pointer;
        border-radius: 10px;
        transition: 300ms background-color linear;

        .left-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        &:hover {
            background-color: rgba(0, 0, 0, 0.05);
        }

        i {
            padding: 0;
            margin: 0 5px
        }
    }

    .groups {
        overflow: auto;

    }

    .stack-chooser {
        display: flex;
        margin: auto;
        flex-direction: column;
        min-width: 200px;
        width: 100%;
        overflow: auto;

        .header {
            font-size: 2em;
            margin-bottom: 20px;
        }

        .content {
            li {
                margin-bottom: 5px;
                font-size: 1.1em;
            }

            .actions {
                margin-top: 20px;
                display: flex;
                justify-content: flex-end;
            }
        }
    }

    ul {
        list-style: none;
        margin: 0;
        padding: 0;
    }

button.mini {
    padding: 5px 10px;
}


.embed {
    &.stack-chooser-root {
        width: auto;
        height: auto;
    }
}
</style>
