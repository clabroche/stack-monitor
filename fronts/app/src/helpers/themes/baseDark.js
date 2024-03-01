/** @type {() => import('./theme').Theme} */
export default () => ({
  rules: {
    system: { backgroundColor: '#313338', color: '#ddd' },
    'system.secondary': { backgroundColor: '#2b2d31', color: '#ddd' },
    'system.tertiary': { color: '#999' },
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
});
