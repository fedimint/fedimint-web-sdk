// import init, { InitOutput, WasmClient } from '../wasm/fedimint_client_wasm.js'

// let client: WasmClient | undefined

// async function workerInit() {
//   await init(new URL('@fedi/common/wasm/fedi_wasm_bg.wasm', import.meta.url))
// }

// const initPromise = workerInit().catch((error) =>
//   postMessage({ error: String(error) }),
// )

// async function rpcRequest(method: string, data: string): Promise<string> {
//   await initPromise
//   return await fedimint_rpc(method, data)
// }

// const handleMessage = async (token: string, method: string, data: string) => {
//   if (method === 'open') {
//     await initPromise
//     client = await WasmClient.open(data)
//     if (client !== undefined) {
//       postMessage({ token, result: true })
//     } else {
//       postMessage({ token, result: false })
//     }
//   } else if (method === 'join_federation') {
//     await initPromise
//     const result = await WasmClient.join_federation(data)
//     postMessage({ token, result })
//   }
// }

// // Handles worker.postMessage calls
// addEventListener('message', (e) => {
//   const { token, method, data } = e.data
//   handleMessage(token, method, data)
//   // rpcRequest(method, data)
//   //   .then((result) => postMessage({ token, result }))
//   //   .catch((error) => postMessage({ error: String(error) }))
// })
