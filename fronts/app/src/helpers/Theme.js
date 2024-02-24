import { merge, cloneDeep } from 'lodash-es';
import { ref } from 'vue';
import CustomObservable from './CustomObservable';

class Theme {
  constructor() {
    this.themes = ref({
      base: {
        rules: {
          system: { backgroundColor: '#f2f4f7', color: '#4c4c4c' },
          'system.terminal': { backgroundColor: '#ffffff00', color: '#4c4c4c', contrastRatio: 7 },
          'system.secondary': { backgroundColor: '#eaebed', color: '#4a5361' },
          'system.tertiary': { color: '#999' },
          'system.accent': {
            backgroundColor1: 'rgb(168, 38, 180)',
            backgroundColor2: 'rgb(157, 27, 209)',
            backgroundColor3: 'rgb(211, 22, 229)',
          },
          'system.border': { borderColor: '#dbdbdb' },
          'system.sidebar': { backgroundColor: 'white' },
          'system.secondary-sidebar': { backgroundColor: 'white' },
          'system.sections': { backgroundColor: '#f7f7f7', innerShadow: '#eee' },
          'git.badge': { backgroundColor: '#b1b1b1', color: 'white' },
          jsonviewer: {
            keyColor: '#0977e6',
            valueKeyColor: '#073642',
          },
        },
      },
      /** ==================================== */
      light: {
        public: true,
        name: 'Light Purple',
        group: 'Light',
        base: 'base',
        preview: {
          background: { backgroundColor: '#f2f4f7' },
          foreground1: { backgroundColor: 'rgb(168, 38, 180)' },
          foreground2: { backgroundColor: 'rgb(10 ,206 ,213)' },
          foreground3: { backgroundColor: 'rgb(211, 22, 229)' },
          foreground4: { backgroundColor: 'rgb(229, 139, 22)' },
        },
        rules: {
          'system.accent': {
            backgroundColor1: 'rgb(168, 38, 180)',
            backgroundColor2: 'rgb(157, 27, 209)',
            backgroundColor3: 'rgb(211, 22, 229)',

            'backgroundColor1-secondary': 'rgb(255, 123, 0)',
            'backgroundColor2-secondary': 'rgb(229, 156, 45)',
            'backgroundColor3-secondary': 'rgb(229, 139, 22)',

            'backgroundColor1-tertiary': 'rgb(47, 161, 182)',
            'backgroundColor2-tertiary': 'rgb(10 ,206 ,213)',
            'backgroundColor3-tertiary': 'rgb(47, 161, 182)',
          },
        },
      },
      lightOrange: {
        public: true,
        name: 'Light Orange',
        group: 'Light',
        base: 'light',
        preview: {
          background: { backgroundColor: '#f2f4f7' },
          foreground1: { backgroundColor: 'rgb(255, 123, 0)' },
          foreground2: { backgroundColor: 'rgb(10 ,206 ,213)' },
          foreground3: { backgroundColor: 'rgb(211, 22, 229)' },
          foreground4: { backgroundColor: 'rgb(229, 139, 22)' },
        },
        rules: {
          'system.accent': {
            'backgroundColor1-tertiary': 'rgb(168, 38, 180)',
            'backgroundColor2-tertiary': 'rgb(157, 27, 209)',
            'backgroundColor3-tertiary': 'rgb(211, 22, 229)',

            backgroundColor1: 'rgb(255, 123, 0)',
            backgroundColor2: 'rgb(229, 156, 45)',
            backgroundColor3: 'rgb(229, 139, 22)',

            'backgroundColor1-secondary': 'rgb(47, 161, 182)',
            'backgroundColor2-secondary': 'rgb(10 ,206 ,213)',
            'backgroundColor3-secondary': 'rgb(47, 161, 182)',
          },
        },
      },
      lightBlue: {
        public: true,
        name: 'Light Blue',
        group: 'Light',
        base: 'light',
        preview: {
          background: { backgroundColor: '#f2f4f7' },
          foreground1: { backgroundColor: 'rgb(47, 161, 182)' },
          foreground2: { backgroundColor: 'rgb(10 ,206 ,213)' },
          foreground3: { backgroundColor: 'rgb(211, 22, 229)' },
          foreground4: { backgroundColor: 'rgb(229, 139, 22)' },
        },
        rules: {
          'system.accent': {
            'backgroundColor1-secondary': 'rgb(168, 38, 180)',
            'backgroundColor2-secondary': 'rgb(157, 27, 209)',
            'backgroundColor3-secondary': 'rgb(211, 22, 229)',

            'backgroundColor1-tertiary': 'rgb(255, 123, 0)',
            'backgroundColor2-tertiary': 'rgb(229, 156, 45)',
            'backgroundColor3-tertiary': 'rgb(229, 139, 22)',

            backgroundColor1: 'rgb(47, 161, 182)',
            backgroundColor2: 'rgb(10 ,206 ,213)',
            backgroundColor3: 'rgb(47, 161, 182)',
          },
        },
      },
      /** ==================================== */
      dark: {
        public: true,
        name: 'Dark Purple',
        group: 'Dark',
        base: 'light',
        preview: {
          background: { backgroundColor: '#2b2d31' },
          foreground1: { backgroundColor: 'rgb(168, 38, 180)' },
          foreground2: { backgroundColor: 'rgb(10 ,206 ,213)' },
          foreground3: { backgroundColor: 'rgb(211, 22, 229)' },
          foreground4: { backgroundColor: 'rgb(229, 139, 22)' },
        },
        rules: {
          system: { backgroundColor: '#313338', color: '#ddd' },
          'system.secondary': { backgroundColor: '#2b2d31', color: '#ddd' },
          'system.tertiary': { color: '#999' },
          'system.accent': {
            backgroundColor1: 'rgb(168, 38, 180)',
            backgroundColor2: 'rgb(157, 27, 209)',
            backgroundColor3: 'rgb(211, 22, 229)',

            'backgroundColor1-secondary': 'rgb(255, 123, 0)',
            'backgroundColor2-secondary': 'rgb(229, 156, 45)',
            'backgroundColor3-secondary': 'rgb(229, 139, 22)',

            'backgroundColor1-tertiary': 'rgb(47, 161, 182)',
            'backgroundColor2-tertiary': 'rgb(10 ,206 ,213)',
            'backgroundColor3-tertiary': 'rgb(47, 161, 182)',
          },
          'system.terminal': { backgroundColor: '#00000000', color: '#ddd', contrastRatio: 7 },
          'system.border': { borderColor: '#444' },
          'system.sidebar': { backgroundColor: '#1e1f22' },
          'system.secondary-sidebar': { backgroundColor: '#2b2d31' },
          'system.sections': { backgroundColor: '#2b2d31', innerShadow: '#353535' },
          'git.badge': { backgroundColor: '#4a5361', color: '#eaebed' },
          jsonviewer: {
            keyColor: '#0977e6',
            valueKeyColor: '#64a9ba',
          },
        },
      },
      darkOrange: {
        public: true,
        name: 'Dark Orange',
        group: 'Dark',
        base: 'dark',
        preview: {
          background: { backgroundColor: '#2b2d31' },
          foreground1: { backgroundColor: 'rgb(255, 123, 0)' },
          foreground2: { backgroundColor: 'rgb(10 ,206 ,213)' },
          foreground3: { backgroundColor: 'rgb(211, 22, 229)' },
          foreground4: { backgroundColor: 'rgb(229, 139, 22)' },
        },
        rules: {
          'system.accent': {
            'backgroundColor1-tertiary': 'rgb(168, 38, 180)',
            'backgroundColor2-tertiary': 'rgb(157, 27, 209)',
            'backgroundColor3-tertiary': 'rgb(211, 22, 229)',

            backgroundColor1: 'rgb(255, 123, 0)',
            backgroundColor2: 'rgb(229, 156, 45)',
            backgroundColor3: 'rgb(229, 139, 22)',

            'backgroundColor1-secondary': 'rgb(47, 161, 182)',
            'backgroundColor2-secondary': 'rgb(10 ,206 ,213)',
            'backgroundColor3-secondary': 'rgb(47, 161, 182)',
          },
        },
      },
      darkBlue: {
        public: true,
        name: 'Dark Blue',
        group: 'Dark',
        base: 'dark',
        preview: {
          background: { backgroundColor: '#2b2d31' },
          foreground1: { backgroundColor: 'rgb(47, 161, 182)' },
          foreground2: { backgroundColor: 'rgb(10 ,206 ,213)' },
          foreground3: { backgroundColor: 'rgb(211, 22, 229)' },
          foreground4: { backgroundColor: 'rgb(229, 139, 22)' },
        },
        rules: {
          'system.accent': {
            'backgroundColor1-secondary': 'rgb(168, 38, 180)',
            'backgroundColor2-secondary': 'rgb(157, 27, 209)',
            'backgroundColor3-secondary': 'rgb(211, 22, 229)',

            'backgroundColor1-tertiary': 'rgb(255, 123, 0)',
            'backgroundColor2-tertiary': 'rgb(229, 156, 45)',
            'backgroundColor3-tertiary': 'rgb(229, 139, 22)',

            backgroundColor1: 'rgb(47, 161, 182)',
            backgroundColor2: 'rgb(10 ,206 ,213)',
            backgroundColor3: 'rgb(47, 161, 182)',
          },
        },
      },
    });
    this.currentTheme = 'light';
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
      localStorage.setItem('currentTheme', 'light');
      currentTheme = 'light';
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
    a = f.a, t = t.a, f = a >= 0 || t >= 0, a = f ? a < 0 ? t : t < 0 ? a : a * P + t * p : 0;
    if (h) return `rgb${f ? 'a(' : '('}${r},${g},${b}${f ? `,${m(a * 1000) / 1000}` : ''})`;
    return `#${(4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(a * 255) : 0)).toString(16).slice(1, f ? undefined : -2)}`;
  },

};
