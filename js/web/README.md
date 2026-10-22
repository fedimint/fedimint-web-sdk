# Browser package

One npm package lives here: [`web-sdk`](web-sdk) is `@fedimint/web-sdk`, the browser SDK. It is
`rust/fedimint-sdk` compiled to WebAssembly, the TypeScript bindings generated from that module,
and the worker that hosts it.

The package's own README is its user documentation and goes to npm with it. This file is about
working on the package in this repository.

## Bindings and the module

The TypeScript in `web-sdk/src/generated/` is committed, but it is generated, not written by hand.
Regenerate it from a source checkout with:

```sh
just generate-sdk-web-bindings
```

which runs `pnpm generate` in the package inside the `.#wasm` Nix shell. This builds
`rust/fedimint-sdk` for `wasm32-unknown-unknown` through Nix and turns the result into the files
under `src/generated/`; see `scripts/generate-sdk-web-bindings.sh` for the details. Run it after
any change to the crate's UniFFI surface and commit the result: CI regenerates on every pull
request and fails the build if the three files ubrn writes differ afterwards.

The module itself, `src/generated/fedimint_sdk.wasm`, is a build output and not in git. The
package's build copies it, and the wasm-bindgen glue beside it, into `dist/generated/`, where the
worker loads it from. Without the module the JavaScript still builds, so that the hosted CI jobs
need no Nix, and the copy step only warns.

## Testing

The browser test that exercises the package against a running federation is run with:

```sh
just test
```

from the repository root. It imports the package through its `exports`, so the worker, the glue
and the module are loaded from `dist`, as an application loads them.

## Size of the wasm module

A browser downloads the module this package ships before the SDK can do anything. On a pull
request, the `Verify / Check Wasm Size` check compares the size of that module, and its size
after `gzip -9`, with those of the commit of the base branch it is merged into. It fails when the
pull request makes either size grow by more than 5%, and its summary has a table of the sizes and
their differences. When the base commit's module cannot be fetched or generated from, the check
shows the sizes of the pull request alone and passes with a warning. It does not run when the
`Verify / Test` job fails before it has built the module.

To get the numbers for a module of your own, generate the bindings and measure the module from the
repository root:

```sh
just generate-sdk-web-bindings
scripts/sdk-web-wasm-size.sh measure js/web/web-sdk/src/generated/fedimint_sdk.wasm
```

It prints the size of the module and its size after `gzip -9`, both in bytes. The second moves by a
hundred bytes or so between two runs of the generator, even on the same crate.
