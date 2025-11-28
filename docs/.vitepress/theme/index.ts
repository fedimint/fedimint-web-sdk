import DefaultTheme from 'vitepress/theme'
// @ts-ignore
import FullWidthLayout from './FullWidthLayout.vue'
// @ts-ignore
import VersionNotice from './VersionNotice.vue'
// @ts-ignore - Temporarily disabled Twoslash
// import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import type { EnhanceAppContext } from 'vitepress'

import './custom.css'
import 'virtual:group-icons.css'

// import '@shikijs/vitepress-twoslash/style.css' // Temporarily disabled

export default {
  ...DefaultTheme,
  Layout: DefaultTheme.Layout,
  enhanceApp({ app }: EnhanceAppContext) {
    app.component('FullWidthLayout', FullWidthLayout)
    app.component('VersionNotice', VersionNotice)
    // TODO: Fix version conflicts - Twoslash temporarily disabled
    // @ts-ignore
    // app.use(TwoslashFloatingVue)
  },
}
