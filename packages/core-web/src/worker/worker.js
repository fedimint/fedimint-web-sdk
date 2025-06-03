// Web Worker for fedimint-client-wasm to run in the browser

// HACK: Fixes vitest browser runner
// TODO: remove once https://github.com/vitest-dev/vitest/pull/6569 lands in a release
globalThis.__vitest_browser_runner__ = { wrapDynamicImport: (foo) => foo() }

let rpcHandler = null

console.log('Worker - init')

self.onmessage = async (event) => {
  if (event.data.type === 'init') {
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
    // Check if rpcHandler is initialized before calling rpc
    if (!rpcHandler) {
      console.error('Worker: rpcHandler not initialized')
      self.postMessage({
        type: 'error',
        error: 'Worker not initialized. Call init first.',
      })
      return
    }

    try {
      rpcHandler.rpc(JSON.stringify(event.data), (response) =>
        self.postMessage(JSON.parse(response)),
      )
    } catch (err) {
      console.error('Worker RPC error:', err)
      self.postMessage({
        type: 'error',
        error: err.toString(),
      })
    }
  }
}
