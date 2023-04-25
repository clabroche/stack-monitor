import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Stack Monitor",
  description: "Configure, share, launch and monitor all yours services in the same place for your development team",
  base: '/stack-monitor/',
  locales: {
    root: {
      label: 'English',
      lang: 'en'
    },
    // fr: {
    //   label: 'French',
    //   lang: 'fr', 
    // }
  },
  themeConfig: {
    search: {
      provider: 'local',
      options: {}
    },
    logo: '/rocket.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting started', link: '/introduction/getting-started' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Stack Monitor', link: '/introduction/what-is' },
          { text: 'Getting started', link: '/introduction/getting-started' },
        ]
      }, {
        text: 'Reference',
        items: [
          {text: 'Options', collapsed: true, items: [
            { text: 'Service options', link: '/reference/service-options' },
            { text: 'Global options', link: '/reference/global-options' },
          ]},
          { text: 'Extend capacities', link: '/reference/extended-options' },
        ]
      }
      , {
        text: 'Reference',
        items: [
          { text: 'Screenshots', link: '/screenshots/screenshots' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/clabroche/stack-monitor' }
    ]
  }
})
