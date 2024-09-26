# Testing

We use [vitest](https://vitest.dev/) for testing library code.

Configuring this properly was tricky. Since the library heavily relies on browser APIs like web workers & wasm, it doesn't really make sense to mock the browser APIs for unit tests.
In order for our tests to be trustworthy, we really need them to run in a realistic browser environment.

Vitest [browser mode](https://vitest.dev/guide/browser/) + playwright (provider) seems to satisfy all our needs. It spins up a real browser to run tests and can run headlessly for CI. I had to add one hack to make it work with the web-worker, but otherwise it seems to work well out of the box.

This framework should be suitable for all the additional libraries we have planned (e.g. react).

## Usage

```bash
# in the root of the repo
pnpm run test
```

- `pnpm test` — runs tests in a headless browser
- `pnpm test:cov` — runs tests and reports coverage
- `pnpm test:ui` — runs tests in the [Vitest UI](https://vitest.dev/guide/ui.html)

When adding new features or fixing bugs, it's important to add test cases to cover the new or updated behavior.
