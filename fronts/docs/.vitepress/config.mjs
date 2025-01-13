import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Stack Monitor",
  vite: {
    server: {
      port: process.env.PORT
    } 
  },
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
        text: 'Guide',
        items: [
          { text: 'First launch', link: '/guide/first-launch.md' },
          { text: 'Create your first service', link: '/guide/create-new-service.md' }
        ]
      }, {
        text: 'Reference',
        items: [
          { text: 'Global environments variables', link:'/reference/global-environment-variables.md'}
        ]
      }, {
        text: 'Integration',
        items: [
          { text: 'Visual Studio Code', link: '/integration/vscode' },
        ]
      },{
        text: 'Other',
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
