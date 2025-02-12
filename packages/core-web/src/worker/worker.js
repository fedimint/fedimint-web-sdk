// Web Worker for fedimint-client-wasm to run in the browser

// HACK: Fixes vitest browser runner
// TODO: remove once https://github.com/vitest-dev/vitest/pull/6569 lands in a release
globalThis.__vitest_browser_runner__ = { wrapDynamicImport: (foo) => foo() }

let rpcHandler = null

console.log('Worker - init')

self.onmessage = async (event) => {
  if (event.type === 'init') {
    try {
      const { RpcHandler } = await import(
        '@fedimint/fedimint-client-wasm-bundler'
      )
      rpcHandler = new RpcHandler()
      self.postMessage({ type: 'init_success' })
    } catch (err) {
      console.error('Worker init failed:', err)
      self.postMessage({ type: 'init_error', error: err.toString() })
    }
  } else {
    rpcHandler.rpc(JSON.stringify(event.data), (response) =>
      self.postMessage(JSON.parse(response)),
    )
  }
}
