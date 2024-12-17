import { getSidebar } from './sidebar'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from 'vitepress-plugin-group-icons'
import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Fedimint Web Sdk',
  description: 'Building Fedimint Ecash into the web',
  ignoreDeadLinks: false,
  lang: 'en-US',
  lastUpdated: true,
  markdown: {
    // TODO: Fix version conflicts
    // @ts-ignore
    codeTransformers: [transformerTwoslash()],
    config: (md) => {
      // @ts-ignore
      md.use(groupIconMdPlugin)
    },
  },
  vite: {
    plugins: [groupIconVitePlugin()],
  },
  /* prettier-ignore */
  head: [
    ['meta', { name: 'keywords', content: 'bitcoin, lightning, ecash, fedimint, typescript, wasm, react' } ],
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#346cff' }],

    // Open Graph
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://web.fedimint.org' }],
    ['meta', { property: 'og:title', content: 'Fedimint Web SDK | Building Ecash into the web' } ],
    ['meta', { property: 'og:site_name', content: 'Fedimint Web SDK' }],
    ['meta', { property: 'og:image', content: 'https://web.fedimint.org/og.png' } ],

    // Twitter
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:creator', content: '@fedimint' }],
    ['meta', { name: 'twitter:site', content: '@fedimint' }],
  ],
  themeConfig: {
    editLink: {
      pattern:
        'https://github.com/fedimint/fedimint-web-sdk/edit/main/docs/:path',
      text: 'Suggest changes to this page',
    },
    footer: {
      message:
        'Released under the <a href="https://github.com/fedimint/fedimint-web-sdk/blob/main/LICENSE">MIT License</a>.',
    },
    nav: [
      { text: 'Documentation', link: '/core/getting-started' },
      { text: 'Examples', link: '/examples/vite-react' },
      {
        text: 'More',
        items: [
          {
            text: 'Contributing',
            link: '/core/dev/contributing',
          },
          {
            text: 'Awesome Fedimint Web SDK',
            link: '/core/dev/awesome',
          },
          {
            text: 'Discussions ',
            link: 'https://chat.fedimint.org',
          },
          {
            text: 'Release Notes ',
            link: 'https://github.com/fedimint/fedimint-web-sdk/releases',
          },
        ],
      },
    ],
    logo: {
      light: '/icon.png',
      dark: '/icon.png',
      alt: 'Fedimint Logo',
    },
    sidebar: getSidebar(),

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/fedimint/fedimint-web-sdk',
      },
      {
        icon: 'npm',
        link: 'https://www.npmjs.com/package/@fedimint/core-web',
      },
      {
        icon: 'discord',
        link: 'https://chat.fedimint.org',
      },
      {
        icon: 'twitter',
        link: 'https://twitter.com/fedimint',
      },
    ],

    outline: [2, 3],
    search: {
      provider: 'local',
      options: {
        _render(src, env, md) {
          const html = md.render(src, env)
          if (env.frontmatter?.search === false) return ''
          if (env.relativePath.startsWith('shared')) return ''
          return html
        },
      },
    },
  },
})
