import DefaultTheme from 'vitepress/theme'
import FullWidthLayout from './FullWidthLayout.vue'
import './custom.css'

export default {
  ...DefaultTheme,
  Layout: DefaultTheme.Layout,
  enhanceApp({ app }) {
    app.component('FullWidthLayout', FullWidthLayout)
  },
}
