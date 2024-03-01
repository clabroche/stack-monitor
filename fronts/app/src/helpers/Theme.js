/* eslint-disable no-multi-assign */
/* eslint-disable no-nested-ternary */
/* eslint-disable max-len */
/* eslint-disable eqeqeq */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-bitwise */
/* eslint-disable no-sequences */
/* eslint-disable no-mixed-operators */
import { merge, cloneDeep } from 'lodash-es';
import { ref } from 'vue';
import CustomObservable from './CustomObservable';
import base from './themes/base';
import lightPurple from './themes/lightPurple';
import lightOrange from './themes/lightOrange';
import lightBlue from './themes/lightBlue';
import darkPurple from './themes/darkPurple';
import darkOrange from './themes/darkOrange';
import darkBlue from './themes/darkBlue';
import baseDark from './themes/baseDark';

class Theme {
  constructor() {
    this.themes = ref({
      light: base(),
      dark: baseDark(),
      /** ==================================== */
      lightPurple: lightPurple(),
      lightOrange: lightOrange(),
      lightBlue: lightBlue(),
      /** ==================================== */
      darkPurple: darkPurple(),
      darkOrange: darkOrange(),
      darkBlue: darkBlue(),
    });
    this.currentTheme = 'lightPurple';
    this.buildedTheme = this.themes.value.light;
    this.observableCurrentTheme = new CustomObservable();
  }

  load(additionnalThemes = {}) {
    Object.assign(this.themes.value, additionnalThemes);
    this.loadCurrentTheme();
    this.apply(this.currentTheme);
  }

  get(property) {
    const [scope, rule] = property.split('/');
    return this.buildedTheme?.rules?.[scope]?.[rule];
  }

  loadCurrentTheme() {
    let currentTheme = localStorage.getItem('currentTheme');
    if (!currentTheme) {
      localStorage.setItem('currentTheme', 'lightPurple');
      currentTheme = 'lightPurple';
    }
    if (currentTheme === 'light') {
      localStorage.setItem('currentTheme', 'lightPurple');
      currentTheme = 'lightPurple';
    }
    if (currentTheme === 'dark') {
      localStorage.setItem('currentTheme', 'darkPurple');
      currentTheme = 'darkPurple';
    }
    this.currentTheme = currentTheme;
  }

  lighter(amount, color) {
    return pSBC.lighter(amount, color);
  }

  buildTheme(_theme) {
    let theme = cloneDeep(this.themes.value[_theme]);
    if (!theme) throw new Error(`${_theme} theme not exists`);
    if (theme.base) {
      if (!this.themes.value[theme.base]) return theme;
      theme = merge(this.buildTheme(theme.base), theme);
    }
    return theme;
  }

  apply(_theme) {
    localStorage.setItem('currentTheme', _theme);
    const theme = this.buildTheme(_theme);
    this.currentTheme = _theme;
    this.buildedTheme = theme;
    this.observableCurrentTheme.next('apply', _theme);
    Object.keys(theme.rules).forEach((rule) => {
      const cssRules = theme.rules[rule];
      Object.keys(cssRules).forEach((cssRule) => {
        const cssVariable = `--${rule.replaceAll('.', '-')}-${cssRule}`;
        const value = cssRules[cssRule];
        setCssVariable(cssVariable, value);
        setCssVariable(`${cssVariable}-darker`, this.lighter(-0.3, value));
        setCssVariable(`${cssVariable}-darkest`, this.lighter(-0.5, value));
        setCssVariable(`${cssVariable}-lighter`, this.lighter(0.3, value));
        setCssVariable(`${cssVariable}-lightest`, this.lighter(0.5, value));
      });
    });
  }
}

// @ts-ignore
function getCssVariable() {
  const r = document.querySelector(':root');
  const rs = getComputedStyle(r);
  return rs.getPropertyValue('--blue');
}

function setCssVariable(key, value) {
  const r = document.querySelector(':root');
  if (!key.startsWith('--')) throw new Error('Css variable should starts with --');
  r.style.setProperty(key, value);
}

export default new Theme();

const pSBC = {
  lighter(p, c0, c1, l) {
    let r; let g; let b; let P; let f; let t; let h; const i = parseInt; const m = Math.round; let a = typeof (c1) === 'string';
    if (typeof (p) !== 'number' || p < -1 || p > 1 || typeof (c0) !== 'string' || (c0[0] != 'r' && c0[0] != '#') || (c1 && !a)) return null;
    if (!this.pSBCr) {
      this.pSBCr = (d) => {
        let n = d.length; const x = {};
        if (n > 9) {
          [r, g, b, a] = d = d.split(','), n = d.length;
          if (n < 3 || n > 4) return null;
          // @ts-ignore
          x.r = i(r[3] == 'a' ? r.slice(5) : r.slice(4)), x.g = i(g), x.b = i(b), x.a = a ? parseFloat(a) : -1;
        } else {
          if (n == 8 || n == 6 || n < 4) return null;
          if (n < 6)d = `#${d[1]}${d[1]}${d[2]}${d[2]}${d[3]}${d[3]}${n > 4 ? d[4] + d[4] : ''}`;
          d = i(d.slice(1), 16);
          if (n == 9 || n == 5)x.r = d >> 24 & 255, x.g = d >> 16 & 255, x.b = d >> 8 & 255, x.a = m((d & 255) / 0.255) / 1000;
          else x.r = d >> 16, x.g = d >> 8 & 255, x.b = d & 255, x.a = -1;
        } return x;
      };
    }
    h = c0.length > 9, h = a ? c1.length > 9 ? true : c1 == 'c' ? !h : false : h, f = this.pSBCr(c0), P = p < 0, t = c1 && c1 != 'c' ? this.pSBCr(c1) : P ? {
      r: 0, g: 0, b: 0, a: -1,
    } : {
      r: 255, g: 255, b: 255, a: -1,
    }, p = P ? p * -1 : p, P = 1 - p;
    if (!f || !t) return null;
    if (l)r = m(P * f.r + p * t.r), g = m(P * f.g + p * t.g), b = m(P * f.b + p * t.b);
    else r = m((P * f.r ** 2 + p * t.r ** 2) ** 0.5), g = m((P * f.g ** 2 + p * t.g ** 2) ** 0.5), b = m((P * f.b ** 2 + p * t.b ** 2) ** 0.5);
    // @ts-ignore
    a = f.a, t = t.a, f = a >= 0 || t >= 0, a = f ? a < 0 ? t : t < 0 ? a : a * P + t * p : 0;
    // @ts-ignore
    if (h) return `rgb${f ? 'a(' : '('}${r},${g},${b}${f ? `,${m(a * 1000) / 1000}` : ''})`;
    // @ts-ignore
    return `#${(4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(a * 255) : 0)).toString(16).slice(1, f ? undefined : -2)}`;
  },

};
