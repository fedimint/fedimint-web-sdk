import init, { WasmClient } from '../wasm/fedimint_client_wasm.js'
import MyWasm from '../wasm/fedimint_client_wasm_bg.wasm'

let wasmClient = null

const streamCancelMap = new Map()

const handleFree = (requestId) => {
  streamCancelMap.delete(requestId)
  console.log('handleFree', requestId)
}

self.onmessage = async (event) => {
  const { type, payload, requestId } = event.data

  if (type === 'init') {
    await init(await MyWasm())
    self.postMessage({ type: 'initialized', data: {}, requestId })
    console.log('INITTED')
  } else if (type === 'open') {
    const { clientName } = payload
    wasmClient = (await WasmClient.open(clientName)) || null
    self.postMessage({
      type: 'open',
      data: { success: !!wasmClient },
      requestId,
    })
    console.log('OPENED')
  } else if (type === 'join') {
    const { inviteCode, clientName: joinClientName } = payload
    try {
      wasmClient = await WasmClient.join_federation(joinClientName, inviteCode)
      self.postMessage({
        type: 'join',
        data: { success: !!wasmClient },
        requestId,
      })
      console.log('JOINED')
    } catch (e) {
      self.postMessage({ type: 'error', error: e.message, requestId })
    }
  } else if (type === 'rpc') {
    const { module, method, body } = payload
    if (!wasmClient) {
      self.postMessage({
        type: 'error',
        error: 'WasmClient not initialized',
        requestId,
      })
      return
    }
    const rpcHandle = await wasmClient.rpc(
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
    console.log('rpc handled', requestId)
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
