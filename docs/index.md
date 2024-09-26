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
