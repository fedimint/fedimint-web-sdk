---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

description: Robust, privacy-focused, and WebAssembly-powered
title: Fedimint Web Sdk
titleTemplate: false

hero:
  name: Fedimint Web Sdk
  text: Building Ecash into the Web
  tagline: Robust, privacy-focused, and WebAssembly-powered
  actions:
    - theme: brand
      text: Get Started
      link: /core/getting-started
    - theme: alt
      text: Learn about Fedimint
      link: https://fedimint.org
    - theme: alt
      text: View on GitHub
      link: https://github.com/fedimint/fedimint-web-sdk

  image:
    src: /icon.png
    alt: Fedimint Logo

features:
  - icon: 🚀
    title: WebAssembly-powered Client
    details: Exposes the robust, fault-tolerant fedimint-client (built in Rust) via WebAssembly. Lazy-Loads within a web worker for performance.
  - icon: 💰
    title: eCash Payments
    details: Includes support for joining federations, sending/receiving eCash, and managing balances.
  - icon: ⚡
    title: Lightning Payments
    details: Ships with zero-setup Lightning Network payments.
  - icon: 🛠️
    title: State Management
    details: Handles the complex state management and storage challenges for browser wallets.
  - icon: 🤫
    title: Privacy Included
    details: Offers a privacy-centric wallet by default.
  - icon: ⚙️
    title: Framework Agnostic
    details: Designed as a "core" library compatible with vanilla JavaScript, laying the groundwork for future framework-specific packages.
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);

  --vp-home-hero-image-background-image: linear-gradient(-45deg, rgba(189, 52, 254, 0.4) 50%, rgba(71, 202, 255, 0.4) 50%);
  --vp-home-hero-image-filter: blur(68px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(88px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(120px);
  }
}
</style>
