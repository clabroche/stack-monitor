/** @type {() => import('./theme').Theme} */
export default () => ({
  rules: {
    system: { backgroundColor: '#f2f4f7', color: '#4c4c4c' },
    'system.terminal': { backgroundColor: '#ffffff00', color: '#4c4c4c', contrastRatio: 7 },
    'system.secondary': { backgroundColor: '#eaebed', color: '#4a5361' },
    'system.tertiary': { color: '#999' },
    'system.accent': {
      backgroundColor1: 'rgb(217, 111, 226)',
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
});
