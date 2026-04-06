import { defineConfig } from 'vitepress'

const githubLink = 'https://github.com/Qiuner/claude-nexus'

export default defineConfig({
  title: 'claude-nexus',
  description: 'The missing power-up for Claude.',
  base: '/claude-nexus/',
  lastUpdated: true,
  themeConfig: {
    search: {
      provider: 'local',
    },
    socialLinks: [{ icon: 'github', link: githubLink }],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Qiuner',
    },
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'Features', link: '/guide/features' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'GitHub', link: githubLink },
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
      },
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'claude-nexus',
      description: 'Claude 缺失的增强套件。',
      link: '/zh/',
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/guide/getting-started' },
          { text: '功能', link: '/zh/guide/features' },
          { text: '安装', link: '/zh/guide/installation' },
          { text: 'GitHub', link: githubLink },
        ],
        sidebar: [
          {
            text: '指南',
            items: [
              { text: '快速开始', link: '/zh/guide/getting-started' },
              { text: '功能介绍', link: '/zh/guide/features' },
              { text: '安装方式', link: '/zh/guide/installation' },
              { text: '本地开发', link: '/zh/guide/development' },
            ],
          },
        ],
        outlineLabel: '页面导航',
        lastUpdatedText: '最后更新于',
        docFooter: {
          prev: '上一页',
          next: '下一页',
        },
        footer: {
          message: '基于 MIT 协议发布。',
          copyright: 'Copyright © 2026 Qiuner',
        },
      },
    },
  },
})
