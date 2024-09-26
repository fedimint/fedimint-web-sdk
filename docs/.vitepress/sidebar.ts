import type { DefaultTheme } from 'vitepress'
import typedocSidebar from '../core/api/typedoc-sidebar.json'

export function getSidebar() {
  return {
    '/core/': [
      {
        text: 'Getting Started',
        items: [
          { text: 'Overview', link: '/core/overview' },
          { text: 'Installation', link: '/core/getting-started' },
          { text: 'Architecture', link: '/core/architecture' },
        ],
      },
      {
        text: 'API',
        link: '/core/api/index.md',
        items: typedocSidebar,
      },
      {
        text: 'TEMP',
        items: [
          { text: 'Markdown Examples', link: '/temp/markdown-examples' },
          { text: 'Runtime API Examples', link: '/temp/api-examples' },
        ],
      },
    ],
    '/dev/': [
      {
        text: 'Dev',
        items: [
          { text: 'Contributing', link: '/dev/contributing' },
          { text: 'Testing', link: '/dev/testing' },
        ],
      },
    ],
  } satisfies DefaultTheme.Sidebar
}
