<template>
  <div v-if="value !== null" :style="{width, textAlign, marginLeft: adjustLeft, marginTop: adjustTop}" class="root" :title="placeholder">
    <section>
      <svg :width="rayon *2 +strokeWidth + padding + adjustContainer" :height="rayon *2 +strokeWidth + padding + adjustContainer" xmlns="http://www.w3.org/2000/svg">
        <circle
          :stroke="strokeColorBg"
          :stroke-width="strokeWidthBg"
          fill="none"
          :cx="rayon + strokeWidth / 2 + padding / 2 + adjustContainer / 2"
          :cy="rayon + strokeWidth / 2 + padding / 2 + adjustContainer / 2"
          :r="rayon"/>
        <circle class="circle"
          :stroke="strokeColor"
          :stroke-width="strokeWidth"
          fill="none"
          :cx="rayon + strokeWidth  / 2 + padding / 2 + adjustContainer / 2"
          :cy="rayon + strokeWidth / 2 + padding / 2 + adjustContainer / 2"
          :r="rayon"
          :stroke-dasharray="(2 * 3.14 * rayon)"
          :stroke-dashoffset="(2 * 3.14 * rayon) * (1 - (value / 100))"
          />
        <g :class="'info info-anim-' + anim" v-if="!noSubtitle">
          <text class='text' :x="17 + adjustSubtitleLeft" :y="rayon +13 + padding / 2  + adjustSubtitleTop" width="60" dominant-baseline="central" alignment-baseline="central" text-anchor="left" :fill="strokeColorBg"  :font-size="fontSize">
            {{value.toFixed(0)}}%
          </text>
        </g>
        <text class='additionnalText'
          :x="rayon + padding - 10 + adjustTitleLeft + adjustContainer / 2"
          :y="rayon + padding - 25 + adjustTitleTop + adjustContainer / 2"
          width="60"
          dominant-baseline="central"
          alignment-baseline="central"
          text-anchor="middle"
          :fill="color" :font-size="fontSize">
            {{title}} {{titleSuffix}}
          </text>
        <text class='additionnalSubText'
          :x="rayon + padding - 10 + adjustTitleLeft"
          :y="rayon + 10 + padding + adjustTitleTop"
          width="60"
          dominant-baseline="central"
          alignment-baseline="central"
          text-anchor="middle"
          :fill="color"
          font-size="15">
            {{subtitle}}
          </text>
      </svg>
    </section>
  </div>
</template>

<script>
export default {
  name: 'doughtnut-chart',
  props: {
    'value': { default: 0 },
    'rayon': { default: 150 },
    'strokeWidth': { default: 25 },
    'strokeWidthBg': { default: 10 },
    'strokeColorBg': { default: '#b8d3ca' },
    'strokeColor': { default: '#5e9985' },
    'padding': { default: 50 },
    'title': { default: '' },
    'adjustTop': {default: 0},
    'adjustLeft': {default: 0},
    'adjustTitleTop': {default: 0},
    'adjustTitleLeft': {default: 0},
    'adjustSubtitleTop': {default: 0},
    'adjustSubtitleLeft': {default: 0},
    'adjustContainer': {default: 0},
    'subtitle': { default: '' },
    'width': {default: 'auto'},
    'textAlign': {
      /** @type {"start" | "right" | "left" | "-webkit-match-parent" | "center" | "end" | "justify" | "match-parent"} */
      default: 'left'
    },
    'noSubtitle': {default: false},
    'fontSize': {default: 30},
    'titleSuffix': {default: ''},
    'color': {default: '#606060'},
    'placeholder': {default: ''},
  },
  data() {
    return {anim: 1}
  },
  mounted() {
    this.animation()
  },
  methods: {
    animation() {
      this.anim = this.anim ? 1 : 2
    }
  }
}
</script>

<style scoped lang="scss">
section {
  display: inline-block;
  height: 55px;
  position: relative;
}
.circle {
  transform: rotate(-180deg);
  transform-origin: center;
}

.info {
  opacity: 1
}

@for $i from 1 through 2 {
  .circle-anim-#{$i} {
    animation: chart-fill- + i 1s reverse
  }
  .info-anim-#{$i} {
    animation: chart-appear- + i 1s forwards
  }
  @keyframes chart-fill-#{$i} {
    to {
      stroke-dasharray: 0 380;
    }
  }
  @keyframes chart-appear-#{$i} {
    to {
      opacity: 1;
    }
  }
}
</style>
