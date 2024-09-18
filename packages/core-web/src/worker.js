// import { WasmClient } from '../wasm/fedimint_client_wasm.js'
// import { WasmClient } from 'fedimint-client-wasm'
// import wasm from '../wasm/fedimint_client_wasm_bg.wasm'

let WasmClient = null
let client = null

const streamCancelMap = new Map()

const handleFree = (requestId) => {
  streamCancelMap.delete(requestId)
  console.log('handleFree', requestId)
}

console.warn('WORKER STARTED')
self.onmessage = async (event) => {
  const { type, payload, requestId } = event.data

  if (type === 'init') {
    WasmClient = (await import('fedimint-client-wasm')).WasmClient
    self.postMessage({ type: 'initialized', data: {}, requestId })
  } else if (type === 'open') {
    const { clientName } = payload
    client = (await WasmClient.open(clientName)) || null
    self.postMessage({
      type: 'open',
      data: { success: !!client },
      requestId,
    })
  } else if (type === 'join') {
    const { inviteCode, clientName: joinClientName } = payload
    try {
      client = await WasmClient.join_federation(joinClientName, inviteCode)
      self.postMessage({
        type: 'join',
        data: { success: !!client },
        requestId,
      })
    } catch (e) {
      self.postMessage({ type: 'error', error: e.message, requestId })
    }
  } else if (type === 'rpc') {
    const { module, method, body } = payload
    if (!client) {
      self.postMessage({
        type: 'error',
        error: 'WasmClient not initialized',
        requestId,
      })
      return
    }
    const rpcHandle = await client.rpc(
      module,
      method,
      JSON.stringify(body),
      (res) => {
        const data = JSON.parse(res)
        self.postMessage({ type: 'rpcResponse', data, requestId })

        if (data.end === undefined) return

        // Handle stream ending
        const handle = streamCancelMap.get(requestId)
        handle?.free()
      },
    )
    streamCancelMap.set(requestId, rpcHandle)
  } else if (type === 'unsubscribe') {
    const rpcHandle = streamCancelMap.get(requestId)
    if (rpcHandle) {
      rpcHandle.cancel()
      rpcHandle.free()
      streamCancelMap.delete(requestId)
      console.log('unsubscribed', requestId)
    }
  } else {
    self.postMessage({
      type: 'error',
      error: 'Unknown message type',
      requestId,
    })
  }
}
