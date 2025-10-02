// Web Worker for fedimint-client-wasm to run in the browser using new RPC architecture

// HACK: Fixes vitest browser runner
// TODO: remove once https://github.com/vitest-dev/vitest/pull/6569 lands in a release
globalThis.__vitest_browser_runner__ = { wrapDynamicImport: (foo) => foo() }

// RpcHandler instance
let rpcHandler = null

// TODO: needs proper logging.

console.log('Worker - init')

/**
 * Type definitions for the worker messages
 *
 * @typedef {import('@fedimint/types').TransportMessageType} WorkerMessageType
 * @typedef {{
 *  type: WorkerMessageType
 *  payload: any
 *  requestId: number
 * }} WorkerMessage
 * @param {{data: WorkerMessage}} event
 */
self.onmessage = async (event) => {
  const { type, payload, requestId } = event.data

  try {
    if (type === 'init') {
      let RpcHandler = (await import('@fedimint/fedimint-client-wasm-bundler'))
        .RpcHandler

      const root = await navigator.storage.getDirectory()
      const dbFileHandle = await root.getFileHandle('fedimint.db', {
        create: true,
      })
      const dbSyncHandle = await dbFileHandle.createSyncAccessHandle()

      rpcHandler = new RpcHandler(dbSyncHandle)

      self.postMessage({ type: 'initialized', data: {}, requestId })
    } else if (
      type === 'set_mnemonic' ||
      type === 'generate_mnemonic' ||
      type === 'get_mnemonic' ||
      type === 'join_federation' ||
      type === 'open_client' ||
      type === 'close_client' ||
      type === 'client_rpc' ||
      type === 'parse_invite_code' ||
      type === 'parse_bolt11_invoice' ||
      type === 'preview_federation' ||
      type === 'cancel_rpc'
    ) {
      if (!rpcHandler) {
        self.postMessage({
          type: 'error',
          error: 'RpcHandler not initialized',
          requestId,
        })
        return
      }

      const rpcRequest = JSON.stringify({
        request_id: requestId,
        ...payload,
      })

      // Debug: Log the final RPC request
      console.log('RPC request being sent:', rpcRequest)

      // Create a callback function to handle RPC responses
      const callback = (responseStr) => {
        try {
          const response = JSON.parse(responseStr)

          // Debug: Log the raw response to see the structure
          console.log(
            'Raw RPC response received:',
            JSON.stringify(response, null, 2),
          )

          self.postMessage({
            type: 'rpcResponse',
            requestId: response.request_id,
            response: response,
          })
        } catch (error) {
          self.postMessage({
            type: 'error',
            error: `Failed to parse RPC response: ${error.message}`,
            requestId,
          })
        }
      }
      // Call the RPC handler
      rpcHandler.rpc(rpcRequest, callback)
    } else if (type === 'cleanup') {
      // TODO: proper cleanup.
      console.log('cleanup message received')
      rpcHandler = null
      self.postMessage({
        type: 'cleanup',
        data: {},
        requestId,
      })
      close()
    } else {
      self.postMessage({
        type: 'error',
        error: `Unknown message type: ${type}`,
        requestId,
      })
    }
  } catch (e) {
    console.error('ERROR', e)
    self.postMessage({ type: 'error', error: e.message || e, requestId })
  }
}
