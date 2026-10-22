# Changelog

Release notes for the Android SDK, `org.fedimint:sdk` on Maven Central,
newest first. Each section also becomes that version's GitHub Release.

The version bump pull request drafts the next section from the commits since
the last release. Rewrite it there for users, grouped under Added, Changed,
Fixed and Breaking as they apply, and remove the draft comment. The release
refuses a version whose section is missing or still a draft. See "Making a
release" in [RELEASING.md](../RELEASING.md).

## 0.1.0-beta.2

<!-- draft: the commits since 0.1.0-beta.1 that touched the SDK.
     Rewrite them for users: what was added, changed or fixed, and anything that
     breaks callers. Then delete this comment; the release refuses a draft. -->

- build(sdk): let docs.rs document the crate without compiling RocksDB (#493) (a848777)
- ci(release): release the crate and both bindings through one process (#464) (221ba39)
- fix(flake): leave the C toolchain out of the default shell (#491) (bc8003c)
- build(sdk): ask for the shared and static libraries on the command line (#468) (baae941)
- feat(sdk): merge the meta override document into Meta::get and Meta::all (#466) (c470a72)
- feat(types): add Nostr NIP 87 discovery types, parser & dev fixture (#470) (1e56a6f)
- feat(sdk): export Debug and Display on Error to the bindings (#467) (99add07)
- fix(sdk): trim v2 ecash notes and accept a lightning: scheme on invoices (#465) (a2a720a)
- chore(js): remove the old TypeScript SDK and what was built on it (#469) (d4bc536)
- build(sdk): depend on fedimint 0.13.0-beta.1 from crates.io (#462) (37aee57)
- chore(rust): remove legacy fedimint-client-uniffi crate (#463) (e4c7c59)
- refactor(sdk): identify a walletv2 deposit by a typed outpoint (#458) (d11c145)
- feat(sdk): make a deposit an operation when the wallet finds it (#453) (1f411cf)
- fix(sdk): wait on fedimint for a rejected funding's recovery to settle (#444) (8cc1084)
- ci(react-native): release the React Native packages to npm from tags (#451) (3eb0c48)
- docs(sdk): drop the finished plan and fix stale docs (#454) (124dd9b)
- fix(sdk): take the lnv2 funding shortfall from its typed error (#443) (307c1d3)
- build(sdk): take ubrn from fedimint's fork (#442) (a066ca3)
- build(sdk): bump fedimint to master and adopt its typed errors (#441) (d335a90)
- fix(ios): on-device security posture (data protection class, backup exclusion, biometric seed gating, pasteboard TTL) (#437) (4747020)
- build(sdk): pin ubrn through a Cargo crate (#439) (873b183)
- fix(sdk): type the activity cursor as a string in TypeScript (#420) (d536cd7)
- feat(ios): route tracing logs and panic hook to os_log on Apple targets (#433) (b2ebe1a)
- fix(walletv2): replace guardian timeout with dedicated scanner wait timeout (#428) (576957b)
- fix(sdk): retry the storage claim briefly to outlast a forking child (#422) (10df129)
- fix(react-native): run the SDK's JNI_OnLoad on Android (#423) (4cb1545)
- fix(flake): provide ubrn in the Darwin iOS shell (#427) (421fd33)
- fix(sdk): report recovery progress, and reach Done once the wallet holds what was found (#413) (74b8db9)
- chore(sdk): stop tying the uniffi pin to fedimint's workspace (#426) (2efb77e)
- chore(flake): stop provisioning Git in dev shells (#421) (35813e7)
- chore(flake): stop provisioning GitHub CLI in dev shells (#414) (e92fcb2)

## 0.1.0-beta.1

The first release of the Android SDK, for testing. The API can still
change before 0.1.0.

### Added

- `createFedimintSdk(dataDir, seed?)` opens the SDK over an app-private
  directory. Pass a `Mnemonic` to restore a seed, or `null` to load the one
  already there, or to create one in an empty directory.
- `Sdk`: `exportMnemonic()`, `preview(invite)` to read a federation's config
  without joining, and `join(invite)`, which returns a `Federation`.
- `Federation`: `balance()`, `capabilities()`, `activity()`, `meta()` and
  `operation(id)`, plus the `ecash()`, `lightning()` and `onchain()` facades.
  Their `quote`, `send` and `receive` calls return operation handles to follow
  with `state()`, `updates()` and `awaitFinal()`.
- `Mnemonic` and `InviteCode` as opaque handles, so a seed or an invite code
  is never handed to Kotlin as a loggable string.
- Errors as `org.fedimint.sdk.Exception`, with an `ErrorCode` from `code()` and
  a message from `reason()`.
- Native libraries for `arm64-v8a` and `x86_64`, minimum SDK 28. The library
  declares the `INTERNET` and `ACCESS_NETWORK_STATE` permissions.
