import type { DefaultTheme } from 'vitepress'
import typedocSidebar from '../core/api/typedoc-sidebar.json'

export function getSidebar() {
  return {
    '/core/': [
      {
        text: 'Getting Started',
        items: [
          { text: 'Overview', link: '/core/getting-started' },
          { text: 'Installation', link: '/core/installation' },
        ],
      },
      {
        text: 'API',
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
  } satisfies DefaultTheme.Sidebar
}
