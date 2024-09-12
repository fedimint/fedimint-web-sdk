import init, { WasmClient } from '../wasm/fedimint_client_wasm.js'
import MyWasm from '../wasm/fedimint_client_wasm_bg.wasm'

let wasmClient = null

self.onmessage = async (event) => {
  const { type, payload, requestId } = event.data

  switch (type) {
    case 'init':
      console.warn('initl', MyWasm)
      await init(await MyWasm())
      self.postMessage({ type: 'initialized', requestId })
      break

    case 'open':
      const { clientName } = payload
      wasmClient = (await WasmClient.open(clientName)) || null
      self.postMessage({ type: 'opened', success: !!wasmClient, requestId })
      break

    case 'join':
      const { inviteCode, clientName: joinClientName } = payload
      wasmClient = await WasmClient.join_federation(joinClientName, inviteCode)
      self.postMessage({ type: 'joined', success: !!wasmClient, requestId })
      break

    case 'rpc':
      const { module, method, body } = payload
      if (!wasmClient) {
        self.postMessage({
          type: 'error',
          error: 'WasmClient not initialized',
          requestId,
        })
        return
      }
      const unsubscribe = await wasmClient.rpc(
        module,
        method,
        JSON.stringify(body),
        (res) => {
          self.postMessage({ type: 'rpcResponse', response: res, requestId })
        },
      )
      self.postMessage({ type: 'rpcUnsubscribe', unsubscribe, requestId })
      break

    default:
      self.postMessage({
        type: 'error',
        error: 'Unknown message type',
        requestId,
      })
  }
}
