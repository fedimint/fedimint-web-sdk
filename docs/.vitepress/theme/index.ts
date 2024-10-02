import DefaultTheme from 'vitepress/theme'
import FullWidthLayout from './FullWidthLayout.vue'
import './custom.css'
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import type { EnhanceAppContext } from 'vitepress'

import '@shikijs/vitepress-twoslash/style.css'

export default {
  ...DefaultTheme,
  Layout: DefaultTheme.Layout,
  enhanceApp({ app }: EnhanceAppContext) {
    app.component('FullWidthLayout', FullWidthLayout)
    app.use(TwoslashFloatingVue)
  },
}
