# Contributing

The development environment comes from [Nix](https://nixos.org). Install it, for example with the
[Determinate Nix Installer](https://github.com/DeterminateSystems/nix-installer), and run
`nix develop` in a checkout. That shell has Node.js, pnpm and `just`, and its first start takes a
while, because it downloads everything it needs. The Android and Apple toolchains and the local
federation the tests run against are in shells of their own, such as `nix develop .#android`.

The [`Justfile`](../Justfile) holds the build and test recipes, and `just --list` shows them.
These READMEs describe the parts of the repository:

- [`rust/fedimint-sdk`](../rust/fedimint-sdk): the SDK crate.
- [`android`](../android) and [`ios`](../ios): the Android and iOS SDKs.
- [`js/react-native`](../js/react-native): the React Native packages.
- [`js/web/sdk-web`](../js/web/sdk-web): the browser SDK.
- [`js/android/integration-tests`](../js/android/integration-tests): the tests that drive the
  Android example app on a device.

The JavaScript packages are a pnpm workspace rooted at `js/`. Run `pnpm --dir js install` once,
and `pnpm --dir js lint:fix` before committing: it formats the repository with prettier, which
continuous integration checks.

Please enable "Allow edits from maintainers" on a pull request, so that the core team can update
it if necessary.
