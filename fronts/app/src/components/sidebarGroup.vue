<template>
    <div :class="{open: _open}">
        <div class="header" @click="toggle">
            <i class="fas fa-chevron-right"></i>
            <h3 class="title">{{ header }}</h3>
        </div>
        <transition name="fade-sidebar">
        <div v-if="_open" class="slot-container" ref="slotRef">

            <slot ></slot>
        </div>
        </transition>
    </div>
</template>

<script setup>
import {ref, watch, nextTick } from 'vue'
const props = defineProps({
    header: { default: '' },
    open: { default: false },
})
const emit = defineEmits(['open', 'close'])
const _open = ref(props.open)
const slotRef = ref()
watch(() => props.open,async () => {
    _open.value = props.open
    await nextTick()
    if(slotRef.value) {
        slotRef.value.style.maxHeight = `${slotRef.value.scrollHeight}px`
    }
})

function toggle() {
    _open.value = !_open.value
    if(_open.value) emit('open')
    else emit('close')
}

</script>

<style lang="scss" scoped>
.header {
    padding: 0 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: 300ms;
    &:hover {
        background-color: rgba(0,0,0,0.05);
    }
    .title {
        margin: 0;
    }
    i {
        transition: 300ms;
    }
}
.open {
    i {
        transform: rotate(90deg);
    }
}

.slot-container {
    max-height: 1000vh;
    opacity: 1;
    transform-origin: top;
}
/* we will explain what these classes do next! */
.fade-sidebar-enter-active,
.fade-sidebar-leave-active {
    transition: 300ms;
}

.fade-sidebar-enter-from,
.fade-sidebar-leave-to {
    transform: scaleY(0);
    max-height: 0 !important;
    opacity: 0;
}
</style>