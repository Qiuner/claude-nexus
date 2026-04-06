import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'claude-nexus',
  description: 'The missing power-up for Claude.',
  base: '/claude-nexus/',
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Features', link: '/guide/features' },
      { text: 'Installation', link: '/guide/installation' },
      { text: 'GitHub', link: 'https://github.com/Qiuner/claude-nexus' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Features', link: '/guide/features' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Development', link: '/guide/development' },
        ],
      },
    ],
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Qiuner/claude-nexus' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Qiuner',
    },
  },
})
