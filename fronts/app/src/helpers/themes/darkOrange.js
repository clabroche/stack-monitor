/** @type {() => import('./theme').Theme} */
export default () => ({
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
      'backgroundColor1-tertiary': 'rgb(217, 111, 226)',
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
});
