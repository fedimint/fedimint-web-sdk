// Web Worker to run in Tauri environments

let tauriInvoke
let tauriEvent
let rpcHandler = null

console.log('Worker - init')

async function importTauriApis() {
  try {
    const tauriApiCore = await import('@tauri-apps/api/core')
    const tauriApiEvent = await import('@tauri-apps/api/event')

    tauriInvoke = tauriApiCore.invoke
    tauriEvent = tauriApiEvent

    console.log('Worker: Tauri APIs imported successfully')
    return true
  } catch (err) {
    console.error('Worker: Failed to import Tauri APIs:', err)
    return false
  }
}

/**
 * Type definitions for the worker messages
 *
 * @typedef {import('../types/worker').WorkerMessageType} WorkerMessageType
 * @typedef {{
 *  type: WorkerMessageType
 *  payload: any
 *  request_id: number
 * }} WorkerMessage
 * @param {{data: WorkerMessage}} event
 */
self.onmessage = async (event) => {
  if (event.data.type === 'init') {
    try {
      console.log('Worker: Initializing with Tauri APIs')

      // Import Tauri APIs
      const tauriApisLoaded = await importTauriApis()
      if (!tauriApisLoaded) {
        throw new Error('Failed to load Tauri APIs')
      }

      // Initialize the RPC handler in the Tauri backend
      try {
        const result = await tauriInvoke('initialize_rpc_handler')
        console.log('Worker: Tauri RPC handler initialized', result)
      } catch (e) {
        console.warn(
          'Worker: Failed to initialize Tauri RPC handler, will try to continue anyway',
          e,
        )
      }

      console.log('Worker: WASM module loaded successfully')
      self.postMessage({
        type: 'init_success',
        request_id: event.data.request_id,
      })
    } catch (err) {
      console.error('Worker init failed:', err)
      self.postMessage({
        type: 'init_error',
        error: err.toString(),
        request_id: event.data.request_id,
      })
    }
  } else if (
    event.data.type === 'client_rpc' ||
    event.data.type === 'open_client' ||
    event.data.type === 'close_client' ||
    event.data.type === 'join_federation' ||
    event.data.type === 'cancel_rpc' ||
    event.data.type === 'parse_invite_code' ||
    event.data.type === 'preview_federation' ||
    event.data.type === 'parse_bolt11_invoice' ||
    event.data.type === 'set_mnemonic' ||
    event.data.type === 'generate_mnemonic' ||
    event.data.type === 'get_mnemonic'
  ) {
    try {
      console.log(
        'Worker: Processing RPC request:',
        event.data.type,
        event.data.client_name || 'no client_name',
      )

      const requestJson = JSON.stringify(event.data)
      console.log('Worker: Sending request to Tauri backend', requestJson)

      // Forward the request to the Tauri backend
      await tauriInvoke('handle_rpc_request', {
        request: requestJson,
      })

      // Listener
      const eventName = `fedimint-response-${event.data.request_id}`

      const unlisten = await tauriEvent.listen(eventName, (eventResponse) => {
        console.log('Worker: Received Tauri event response', eventResponse)

        // Forward the response back to the JavaScript client
        self.postMessage(eventResponse.payload)

        // Clean up the listener after receiving the response
        if (
          eventResponse.payload.kind?.type === 'end' ||
          eventResponse.payload.kind?.type === 'error' ||
          eventResponse.payload.kind?.type === 'aborted'
        ) {
          unlisten()
        }
      })
    } catch (err) {
      console.error('Worker: RPC call failed:', err)
      self.postMessage({
        type: 'error',
        request_id: event.data.request_id,
        error: err.toString(),
      })
    }
  } else {
    console.error('Worker: Unknown message type:', event.data.type)
    self.postMessage({
      type: 'error',
      request_id: event.data.request_id || 0,
      error: `Unknown message type: ${event.data.type}`,
    })
  }
}
