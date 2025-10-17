# Fedimint Expo/React Native Example

A simple Fedimint wallet example built with Expo and React Native, demonstrating how to use the `@fedimint/react-native` bindings to create a wallet and generate a recovery phrase.

## Architecture

This app demonstrates the correct architectural pattern for Fedimint on React Native:

```
Expo App (UI)
    ↓
@fedimint/core (Shared TypeScript API)
    ↓
RNTransport (Thin adapter)
    ↓
UniFFI Bindings (@fedimint/react-native)
    ↓
Rust (fedimint-client)
```

**Key benefit**: ~90% of the TypeScript code is shared with web apps!

## Features

This simple example demonstrates:

- 🔑 Creating a Fedimint wallet
- 📝 Generating a BIP39 recovery phrase (mnemonic)
- 📋 Copying the recovery phrase to clipboard

## Prerequisites

- Node.js 20+
- Expo CLI
- iOS: Xcode and CocoaPods
- Android: Android Studio and SDK
- Rust 1.88.0+ (for building native library)

## Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Build the native Fedimint library (iOS)
cd ../../packages/react-native
pnpm run ubrn:checkout  # If not already done
pnpm run ubrn:ios

# 3. Build for Android (optional)
pnpm run ubrn:android

# 4. Return to app
cd ../../examples/rn-app
```

## Running the App

⚠️ **Important**: This app requires **native platforms** (iOS or Android). Web is not supported as it requires native Rust bindings via UniFFI.

### iOS

```bash
pnpm run ios
# or
npx expo run:ios
```

### Android

```bash
pnpm run android
# or
npx expo run:android
```

### Development

```bash
pnpm start
```

Then press:

- `i` for iOS
- `a` for Android
- ~~`w` for web~~ (not supported - use native platforms only)

**Note**: On web, the app will show "Web Not Supported" message

## Usage

1. Launch the app on iOS or Android
2. Tap "✨ Create Wallet" button
3. Your recovery phrase will be generated and displayed
4. Write down the 12 words in order (keep them safe!)
5. Optionally, tap "📋 Copy to Clipboard" to copy the phrase

**That's it!** This example shows the basics of initializing a Fedimint wallet on React Native.

For a complete wallet with federation joining, balance checking, and payments, see the more complex examples in the documentation.

## Code Structure

```
lib/
├── wallet.ts       - Wallet initialization using @fedimint/core
└── utils.ts        - Utility functions

app/
├── _layout.tsx     - Root layout
└── (tabs)/
    ├── _layout.tsx    - Screen layout
    └── index.tsx      - Main screen (wallet creation & recovery phrase)
```

## Key Implementation Details

### Wallet Initialization (`lib/wallet.ts`)

```typescript
import { WalletDirector, type FedimintWallet } from '@fedimint/core'
import { RNTransport } from '@fedimint/transport-react-native'

export async function initializeWallet(): Promise<FedimintWallet> {
  const dbPath = getDbPath()
  const transport = new RNTransport(dbPath)
  await transport.init()

  const director = new WalletDirector(transport)
  const wallet = await director.createWallet()

  return wallet
}
```

### Creating a Wallet

```typescript
import { initializeWallet, getDirector } from '@/lib/wallet'

// Initialize the wallet
await initializeWallet()

// Generate recovery phrase
const director = getDirector()
const words = await director.generateMnemonic()
console.log('Recovery phrase:', words)
```

## Same API as Web!

This app uses the **exact same API** as the web examples. The only difference is the transport layer (RNTransport vs WasmWorkerTransport).

## File Sizes

| File                   | Lines | Purpose               |
| ---------------------- | ----- | --------------------- |
| `lib/wallet.ts`        | ~140  | Wallet initialization |
| `lib/utils.ts`         | ~5    | Utility functions     |
| `app/(tabs)/index.tsx` | ~350  | Main UI               |

Total custom code: ~500 lines (UI + setup)

Shared code from `@fedimint/core`: ~5,000+ lines (all the heavy lifting!)

## Troubleshooting

### "Cannot find module @fedimint/core"

Install dependencies:

```bash
pnpm install
```

### Native module not found

Build the native library:

```bash
cd ../../packages/react-native
pnpm run ubrn:ios  # or ubrn:android
```

### Expo prebuild

If needed:

```bash
npx expo prebuild
```

## Security Notes

⚠️ This is a development example:

- Mnemonics are stored in plain text
- No encryption on database
- No secure storage (Keychain/Keystore)
- DO NOT use in production without hardening

For production:

- Use `expo-secure-store` for mnemonic
- Encrypt database
- Add biometric auth
- Implement proper key management

## Learn More

- [Fedimint Documentation](https://fedimint.org)
- [@fedimint/core API](../../packages/core/README.md)
- [Expo Documentation](https://docs.expo.dev)
- [Other Examples](../)

## License

MIT
