import { defineConfig } from 'vitepress'

const githubLink = 'https://github.com/Qiuner/claude-nexus'
const siteUrl = 'https://qiuner.github.io/claude-nexus'
const siteTitle = 'claude-nexus'
const siteDescription = 'A browser extension for Claude with folders, timeline navigation, prompt library, chat export, and bilingual support.'
const siteKeywords = [
  'Claude extension',
  'Claude chat organizer',
  'Claude folder manager',
  'Claude prompt library',
  'Claude conversation export',
  'Claude timeline navigation',
  'Claude browser extension',
  'claude.ai productivity',
]

export default defineConfig({
  title: siteTitle,
  description: siteDescription,
  base: '/claude-nexus/',
  sitemap: {
    hostname: siteUrl,
  },
  head: [
    ['meta', { name: 'theme-color', content: '#4285F4' }],
    ['meta', { name: 'keywords', content: siteKeywords.join(', ') }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: siteTitle }],
    ['meta', { property: 'og:title', content: siteTitle }],
    ['meta', { property: 'og:description', content: siteDescription }],
    ['meta', { property: 'og:url', content: `${siteUrl}/` }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: siteTitle }],
    ['meta', { name: 'twitter:description', content: siteDescription }],
    ['link', { rel: 'canonical', href: `${siteUrl}/` }],
    [
      'script',
      { type: 'application/ld+json' },
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: siteTitle,
        applicationCategory: 'BrowserApplication',
        operatingSystem: 'Chrome',
        description: siteDescription,
        url: `${siteUrl}/`,
        downloadUrl: 'https://chromewebstore.google.com/detail/claude-nexus/mjlaeohblnaalakaflnchcmpoojjejka',
        softwareVersion: '1.4.0',
        author: {
          '@type': 'Person',
          name: 'Qiuner',
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      }),
    ],
  ],
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
      title: siteTitle,
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
