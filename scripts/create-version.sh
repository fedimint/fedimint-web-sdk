#!/bin/bash

# Fedimint SDK Docs Versioning Script
# This script creates a versioned copy of your current docs

echo "🚀 Creating versioned documentation for Fedimint SDK"

# Configuration
VERSION="1.0.0"
DOCS_DIR="docs"
VERSIONS_DIR="versions"

# Create versions directory if it doesn't exist
mkdir -p "$VERSIONS_DIR"

# Create version-specific directory
VERSION_DIR="$VERSIONS_DIR/$VERSION"
mkdir -p "$VERSION_DIR"

echo "📁 Copying current docs to version $VERSION"

# Copy all documentation files
cp -r "$DOCS_DIR"/* "$VERSION_DIR/"

# Update the version-specific config
cat > "$VERSION_DIR/.vitepress/config.ts" << 'EOF'
import { getSidebar } from './sidebar'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
} from 'vitepress-plugin-group-icons'
import { defineConfig } from 'vitepress'
import { Plugin as VitePressPlugin } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Fedimint Sdk v1.0.0',
  description: 'Building Fedimint Ecash into Apps (Legacy Documentation)',
  base: '/v1/', // Important: set base path for versioned docs
  ignoreDeadLinks: false,
  lang: 'en-US',
  lastUpdated: true,
  
  // Add version banner
  head: [
    ['meta', { name: 'keywords', content: 'bitcoin, lightning, ecash, fedimint, typescript, wasm, react' } ],
    ['link', { rel: 'icon', href: '/v1/favicon.ico' }], // Update paths
    ['meta', { name: 'theme-color', content: '#346cff' }],
    
    // Version notice styles
    ['style', {}, `
      .version-banner {
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        border-bottom: 2px solid #f59e0b;
        padding: 8px 16px;
        text-align: center;
        font-weight: 500;
      }
      .version-banner a {
        color: #d97706;
        text-decoration: none;
        font-weight: 600;
      }
      .version-banner a:hover {
        text-decoration: underline;
      }
    `],
    
    // Add banner script
    ['script', {}, `
      if (typeof window !== 'undefined') {
        window.addEventListener('DOMContentLoaded', function() {
          const banner = document.createElement('div');
          banner.className = 'version-banner';
          banner.innerHTML = '⚠️ You are viewing legacy documentation for v1.0.0. <a href="/">Upgrade to v2.0.0 →</a>';
          document.body.insertBefore(banner, document.body.firstChild);
        });
      }
    `]
  ],
  
  // Rest of your config...
  themeConfig: {
    nav: [
      { 
        text: 'v1.0.0 (Legacy)', 
        items: [
          { text: 'v2.0.0 (Latest)', link: '/' },
          { text: 'v1.0.0 (Current)', link: '/v1/' }
        ]
      },
      { text: 'Documentation', link: '/v1/core/getting-started' },
      { text: 'Examples', link: '/v1/examples/vite-react' },
    ],
    sidebar: getSidebar(),
    // ... rest of your theme config
  },
})
EOF

echo "✅ Version $VERSION documentation created in $VERSION_DIR"
echo "📝 Next steps:"
echo "   1. Deploy $VERSION_DIR to your hosting with base path /v1/"
echo "   2. Update your main docs for v2.0.0"
echo "   3. Add version switcher to your main docs"

echo "🌐 Suggested deployment structure:"
echo "   - https://sdk.fedimint.org/ (v2.0.0 - main docs)"
echo "   - https://sdk.fedimint.org/v1/ (v1.0.0 - legacy docs)"
