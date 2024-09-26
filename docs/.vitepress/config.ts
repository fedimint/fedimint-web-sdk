import { getSidebar } from './sidebar'
import { withMermaid } from 'vitepress-plugin-mermaid'

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: 'Fedimint Web Sdk',
  description: 'Building Fedimint Ecash into the web',
  ignoreDeadLinks: false,
  lang: 'en-US',
  lastUpdated: true,
  // base: '/fedimint-web-sdk/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
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
      { text: 'Home', link: '/' },
      { text: 'Core', link: '/core/getting-started' },
      { text: 'Packages', link: '/packages' },
      { text: 'Examples', link: '/examples' },
      {
        text: 'More',
        items: [
          {
            text: 'Contributing',
            link: '/dev/contributing',
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
