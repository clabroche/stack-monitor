<template>
<div class="table-root">
  <div class="table-wrapper" ref="tableWrapperRef" @scroll="scroll" :class="{scroll: isScrolling, center, noBorder, noHover}" :style="{maxHeight: height}">
    <table :class="{['table-group-by']: !Array.isArray(computedList) && computedList.type ==='groupBy'}">
      <caption>Table</caption>
      <thead v-if="!noHeader">
        <tr>
          <th v-for="header of computedHeaders" :key="'th-' + header.id" :id="header.id" :style="{width: header.width ? header.width : ''}">
            <div class="header">
              <div class="sort-container" @click="changeSort(header)" v-if="header.label && !header.disableSort">
                <i class="fas fa-sort-up" :class="{active: header.sortByAsc}" aria-hidden="true"></i>
                <i class="fas fa-sort-down" :class="{active: header.sortByDesc}" aria-hidden="true"></i>
              </div>
              {{header.label}}
            </div>
            <slot :name="'header-' + header.id"></slot>
          </th>
        </tr>
      </thead>
      <div v-if="loading" class="spinner">
        <spinner/>
      </div>
      <tbody v-else-if="noElements">
        <tr>
          <td :colspan="computedHeaders.length">
            <slot name="fallback">Aucun élément à afficher</slot >
          </td>
        </tr>
      </tbody>
      <tbody v-else-if="noElementsFilter">
        <tr>
          <td :colspan="computedHeaders.length">
            <slot name="fallbackFilter">Aucun élément à afficher pour ce filtre</slot >
          </td>
        </tr>
      </tbody>
      <tbody v-else-if="develop" >
        <template v-for="(row, i) of computedList" :key="'rows-' + i">
          <tr>
            <td v-for="(header, i) of computedHeaders" :key="i +'-td-' + header.id" :style="{width: header.width ? header.width : ''}"
              @click="click(row, header, row[header.id])">
              <slot :name="header.id" :item="row[header.id]" :row="row">
                {{row[header.id]}}
              </slot>
            </td>
          </tr>
          <transition name="develop-row">
          <tr v-if="openRows.includes(row)" class="develop-row">
            <td :colspan="computedHeaders.length">
              <slot name="develop" :row="row"></slot>
            </td>
          </tr>
          </transition>
        </template>
      </tbody>
      <tbody v-else-if="Array.isArray(computedList)">
        <tr v-for="(row, rowIndex) of computedList" :key="`row-${rowIndex}`">
          <td v-for="(header, i) of computedHeaders" :key="i +'-td-' + header.id" :style="{width: header.width ? header.width : ''}"
            @click="click(row, header, row[header.id])">
            <slot :name="header.id" :item="row[header.id]" :row="row" :index="i">
              {{row[header.id]}}
            </slot>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <template v-for="(row, i) of computedList.rows" :key="'rows-' + i">
          <tr v-if="row.tableLetter" class="letter">
            <td><div>{{row.label}}</div></td>
          </tr>
          <tr v-else>
            <td v-for="(header, i) of computedHeaders" :key="i +'-td-' + header.id" :style="{width: header.width ? header.width : ''}"
              @click="click(row, header, row[header.id])">
              <slot :name="header.id" :item="row[header.id]" :row="row">
                {{row[header.id]}}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
  <div class="pagination" v-if="(computedList?.length || computedList?.rows?.length) && nbTotalPagination && nbTotalPagination !== 1 && !lazy">
    <button @click="previousPage" v-if="offset"><i class="fas fa-chevron-left"></i></button>
    <button>{{offset + 1}} sur {{nbTotalPagination}}</button>
    <button @click="nextPage" v-if="offset + 1 < nbTotalPagination"><i class="fas fa-chevron-right"></i></button>
  </div>
</div>
</template>

<script>

/**
 * @example :header="[
 *     {id: 'img', label: ''},
 *     {id: 'name', label: 'Name', customSortValue: (name)=> name.toUpperCase()},
 *     {id: 'date', label: 'Date', customValue: (val)=> dayjs(val).format('L')},
 * ]"
 * 
 * @example Async
 *  <table-generic :asyncValue="getProductByPage"/>
 * async function getProductsByPage({offset,maxPerPage,sortDirection,sortProperty,filterValue}) {
 *    const array = await sever.get(`/product?sortDirection=${sortDirection}&sortProperty=${sortProperty}........`) 
 *    return array
 * }
 */

import {computed, ref, onMounted, reactive, watch} from "vue"
import {sort} from "fast-sort"
import dotObject from "dot-object"
import { cloneDeep, groupBy } from 'lodash-es'
import dayjs from 'dayjs'
import Spinner from './Spinner.vue'
import debounce from 'debounce'
export default {
  components: {Spinner},
  props: {
    value: {default: () => ([]), type: Array},
    asyncValue: {default: null, type: Function},
    headers: {default: () => ([]), type: Array},
    defaultSortProperty: {default: '', type: String},
    defaultSortDirection: {default: 'asc', type: String},
    showGroups: {default: false, type: Boolean},
    height: {default: '', type: String},
    filterValue: {default: '', type: String},
    filterSchema: {default: () => ({}), type: Object},
    center: {default: false, type: Boolean},
    develop: {default: false, type: Boolean},
    noHeader: {default: false, type: Boolean},
    noHover: {default: false, type: Boolean},
    maxPerPage: {default: 0, type: Number},
    totalRows: {default: 0, type: Number},
    noBorder: {default: false, type: Boolean},
    customGroupByValue: {default: null, type: Function},
    customGroupByLabel: {default: null, type: String},
    lazy: {default: false, type: Boolean}
  },
  setup(props, component) {
    const tableWrapperRef = ref()
    const loading = ref(false)
    const offset = ref(0)
    // Init list in async/sync way
    const asyncValue = ref([])
    const isAsync = ref(props.asyncValue ? true : false)
    const list = computed(() => {
      return isAsync.value ? asyncValue.value : props.value
    })
    
    // Scroll behavior
    const nbPxToTriggerLoadingInLazyMode = 400
    const isScrolling = ref(false)
    const lazyLoad = debounce(() => {
        offset.value++
    }, 100)
    const scroll = (evt) => {
      isScrolling.value = evt.target.scrollTop !== 0
      const isEnd = evt.target.offsetHeight + evt.target.scrollTop >= evt.target.scrollHeight - nbPxToTriggerLoadingInLazyMode
      if(props.lazy && isEnd) {
        lazyLoad()
      }
    }

    // Sort behavior
    const sortProperty = ref('')
    const sortDirection = ref('asc')
    const changeSort = (header) => {
      if(sortProperty.value !== header.id) sortDirection.value = "asc"
      else {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      }
      sortProperty.value = header.id
    }

    // Headers beahavior
    const computedHeaders = computed(() => {
      const addSort = (header) =>  {
        header.sortByAsc = sortProperty.value === header.id && sortDirection.value === 'asc'
        header.sortByDesc = sortProperty.value === header.id && sortDirection.value === 'desc'
        return header
      }
      if(props.headers && props.headers.length) {
        return props.headers.map(header => {
          if(typeof header === 'string') return addSort({label: header, id: header})
          return addSort(header)
        })
      }
      const headersList = {}
      list.value.map(value => {
        if(value) Object.keys(value).forEach(key => headersList[key] = {label: key, id: key})
      })
      return Object.values(headersList).map(addSort)
    })
    onMounted(() => {
      sortProperty.value = props.defaultSortProperty || computedHeaders.value[0]?.id
      sortDirection.value = props.defaultSortDirection || 'asc'
    })
    
    // Computed visible lines
    const computedList = computed(() => {
      const customSort = computedHeaders.value.filter(header => header.id === sortProperty.value).pop()
      const sortFunction = (val) => {
        return customSort && customSort.customSortValue 
          ? customSort.customSortValue(val[sortProperty.value])
          : val[sortProperty.value]
      }
      const headersById = computedHeaders.value.reduce((obj, header) => {
        obj[header.id] = header
        return obj
      }, {})

      // Transform values 
      const transform = (_row) => {
        const row = cloneDeep(_row)
        computedHeaders.value.forEach(({id}) => {
          const value = row[id]
          if(headersById[id] && headersById[id].customValue) {
            row[id] = headersById[id].customValue(value, row)
          } else {
            row[id] = value
          }
        })
        return row
      }

      // Group Behavior
      const groupByFunction = (row) => {
        if(props.customGroupByValue) return props.customGroupByValue(row[sortProperty.value])
        if(headersById[sortProperty.value] && headersById[sortProperty.value].customGroupByValue) {
          return headersById[sortProperty.value].customGroupByValue(row[sortProperty.value])
        } else if(typeof row[sortProperty.value] === 'string') {
          return row[sortProperty.value].toString().toUpperCase().substr(0, 1)
        } else {
          return row[sortProperty.value]
        }
      }
      const sortGroups = (groups) => {
        const keys = sortDirection.value === 'asc'
          ? sort(Object.keys(groups)).asc()
          : sort(Object.keys(groups)).desc()
        
        const rows = []
        keys.forEach(key => {
          const label = props.customGroupByLabel
            ? groups[key][0][props.customGroupByLabel]
            : key
          rows.push({tableLetter: true, label}, ...groups[key])
        })
        return {
          type: 'groupBy',
          rows
        }
      }

      const filterFunction = row => {
        return Object.keys(row).map(key => {
          if(typeof row[key] === 'string') {
            return props.filterValue 
              ? row[key]
              : row[key].toUpperCase().includes(props.filterValue.toUpperCase()) 
          } else if(typeof row[key] === 'number') {
            return props.filterValue
              ? row[key].toString()
              : row[key].toString().includes(props.filterValue) 
          } else {
            return false
          }
        }).some(prop => prop)
      }

      const sortedFilteredTransformedArray = sortDirection.value === 'asc'
        ? sort(list.value).asc(sortFunction).map(transform).filter(filterFunction)
        : sort(list.value).desc(sortFunction).map(transform).filter(filterFunction)

      const to = offset.value * props.maxPerPage +  props.maxPerPage
      const from = props.lazy ? 0 : offset.value * props.maxPerPage
      const slicedSortedFilteredTransformedArray = props.maxPerPage && !isAsync.value
        ? sortedFilteredTransformedArray.slice(from, to)
        : sortedFilteredTransformedArray

      return props.showGroups 
        ? sortGroups(groupBy(slicedSortedFilteredTransformedArray, groupByFunction))
        : slicedSortedFilteredTransformedArray
    })
    
    const openRows = reactive([])
    const isGroupByTable = computed(() => computedList.value?.type ==="groupBy")

    // Pagination data
    const nbTotalPagination = computed(() => {
      if(isAsync.value) return Math.ceil(props.totalRows / props.maxPerPage)
      const totalNumber = list.value?.length
      const currrentNumber = isGroupByTable.value
          ? computedList.value?.rows?.length
          : computedList.value?.length
      const page = Math.ceil(totalNumber / currrentNumber)
      return Number.isNaN(page) ? 0 : page
    })
    const formatDateIfNeeded = (value) => {
      if(/[0-9]{2}\/[0-9]{2}\/[0-9]{4}/.test(props.filterValue) ) {
        value = dayjs(props.filterValue, 'DD/MM/YYYY').format('YYYY-MM-DD') 
      } else if(/[0-9]{2}\/[0-9]{4}/.test(props.filterValue) ) {
        value = dayjs(props.filterValue, 'MM/YYYY').format('YYYY-MM') 
      }
      return value
    }
    // Update async list  
    const loadAsyncValue = async() => {
      if(!props.asyncValue) return
      loading.value = true
      let filter = {}
      if (props.filterValue != '' && props.filterSchema) {
        const exclude = [ // All unwanted props (like dayjs)
          '.\\$L$',
          '.\\$u$',
          '.\\$d$',
          '.\\$x$',
          '.\\$y$',
          '.\\$M$',
          '.\\$D$',
          '.\\$W$',
          '.\\$H$',
          '.\\$m$',
          '.\\$s$',
          '.\\$ms$',
        ]
        const regex = new RegExp(exclude.join('|'))
        filter['$or'] =  Object
            .keys(dotObject.dot(props.filterSchema)) // Get all props from object
            .map(key => key.replace(regex, '')) // Remove all unwanted props
            .filter((item, pos, arr) => arr.indexOf(item) == pos) // Dedupe
            .map(key => {
              let value = props.filterValue
              value = formatDateIfNeeded(value)
              return { // Construct mongo query
                [key]: {
                  '$regex': value,
                  '$options': 'i' 
                }
              }
            })
      }
      const res = await props.asyncValue({
        offset: props.lazy ? 0 : offset.value * props.maxPerPage,
        maxPerPage: props.lazy ? offset.value * props.maxPerPage +  props.maxPerPage : props.maxPerPage,
        sort: {[sortProperty.value]: sortDirection.value === 'asc' ? 1 : -1},
        sortProperty: sortProperty.value,
        filter: filter
      }).finally(() => loading.value = false)
      if(!Array.isArray(res)) throw new Error('Async table return should be an array')
      asyncValue.value = res
    }
    const watcher = computed(() => [
      props.asyncValue,
      props.filterValue,
      offset.value,
      sortDirection.value,
      sortProperty.value,
    ])
    watch(() => watcher.value, loadAsyncValue)
    onMounted(loadAsyncValue)
    return {
      tableWrapperRef,
      loading,
      offset,
      nbTotalPagination,
      computedHeaders,
      computedList,
      scroll,
      isScrolling,
      changeSort,
      openRows,
      isGroupByTable,
      noElements:computed(() => {
        return isGroupByTable.value
          ? !computedList.value?.rows?.length && !props.filterValue
          : !computedList.value?.length && !props.filterValue
      }),
      noElementsFilter:computed(() => {
        return isGroupByTable.value
          ? !computedList.value?.rows?.length && props.filterValue
          : !computedList.value?.length && props.filterValue
      }),
      previousPage() {
        if(offset.value !==0) {
          offset.value--
          tableWrapperRef.value.scrollTop = 0
        }
      },
      nextPage() {
        offset.value++
        tableWrapperRef.value.scrollTop = 0
      },
      click(row, header, value) {
        if(props.develop) {
          openRows.includes(row)
            ? openRows.splice(openRows.indexOf(row), 1)
            : openRows.push(row)
        } else {
          component.emit('row-click', {row})
          component.emit('td-click', {row, header, value})
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.table-root {
  background-color: var(--system-sidebar-backgroundColor);
  color: var(--system-sidebar-color);;

  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 10px 0 rgba(0,0,0,0.1);
  th, td {
    padding: 5px 5px;
    vertical-align: middle;
    font-size: 1em;
    word-break: break-word
  }
  th {
    text-align: left;
    z-index: 1;
    font-weight: normal;
    color: var(--system-sidebar-color);;
    .header {
      display: flex;
    }
  }
  td {
    width:200px
  }
  tr {
    margin: 3px 0;
  }
  
  .center {
    th .header {
      justify-content: center;
    }
    td {
      text-align: center;
    }
  }
  thead {
    box-shadow: 0 0 10px 0 rgba(0,0,0,0.2);
    th {
      padding: 15px 5px;
      box-sizing: border-box;
    }
  }
  tbody tr:hover {
    background-color: rgba(0,0,0,0.05);
    cursor: pointer;
    transition: 300ms;
    border-radius: 20px;
  }
  .scroll thead th {
    box-shadow: 0 4px 11px -1px #d1d1d1;
    transition: 200ms;
  }
  .table-wrapper{
    overflow-y: auto;
    flex-grow: 1;
    height: 100%;
    position: relative;
  }
  .table-wrapper th{
      position: sticky;
      top: 0;
      background-color: var(--system-sidebar-backgroundColor);
      color: var(--system-sidebar-color);;

  }
}
table {
  width: 100%;
  table-layout: fixed;
}
.table-group-by {
  th:first-of-type {
    z-index: 1;
    ::before {
      content: "";
      width: 40px;
      height: 100%;
      background-color: var(--system-sidebar-backgroundColor);
      color: var(--system-sidebar-color);;
      position: absolute;
      left: 0;
      top: 0;
      z-index: -1;
      transform: translateX(-40px);
    }
  }
  .letter {
    height: 40px;
    display: flex;
    align-items: flex-end;
    &:hover {
      background-color: transparent;
    }
    &:first-of-type {
      height: 30px;
    }
    td {
      width: max-content;
      position: absolute;
      padding: 0;
    }
    div {
      background-color: var(--system-sidebar-backgroundColor);
      color: var(--system-sidebar-color);;
      border: 1px solid #ddd;
      padding: 10px 12px;
      box-sizing: border-box;
      margin: 0 10px;
      display: flex;
      border-radius: 12px;
      justify-content: center;
      align-items: center;
    }
  }
}
.sort-container {
  position: relative;
  color: lightgrey;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  width:10px;
  margin-right: 5px;
  i {
    position: absolute;
  }
  .active {
    color: black;
  }
}
.pagination {
  display: flex;
  justify-content: center;
  margin-left: auto;
  margin-right: 0;
  margin-top: 15px;
  border: 1px solid lightgrey;
  width: max-content;
  border-radius: 4px;
  button {
    background-color: transparent;
    color: black;
    border: 0;
    border-radius: 4px;
  }
}
.noBorder {
  tr {
    td {
      border: none;
      &:first-child {border: none;}
      &:last-child {border: none;}
    }
  }
}
.spinner {
  height: 140px;
}
caption {
  display: none;
}
.noHover {
  tbody tr:hover {
    background-color: transparent;
  }
}
</style>