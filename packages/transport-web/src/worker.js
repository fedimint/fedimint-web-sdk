// Web Worker for fedimint-client-wasm to run in the browser

// HACK: Fixes vitest browser runner
// TODO: remove once https://github.com/vitest-dev/vitest/pull/6569 lands in a release
globalThis.__vitest_browser_runner__ = { wrapDynamicImport: (foo) => foo() }

// dynamically imported rpcHandler
/** @type {import('@fedimint/fedimint-client-wasm-bundler').RpcHandler} */
let rpcHandler
let dbSyncHandle = null
let dbFilename = null

console.log('Worker - init')

self._resolveLightningAddress = async (lightningAddress) => {
  const [username, domain] = lightningAddress.split('@')
  if (!username || !domain) {
    throw new Error('Invalid lightning address format')
  }

  const lnurl = `https://${domain}/.well-known/lnurlp/${encodeURIComponent(
    username,
  )}`
  const response = await fetch(lnurl)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch lightning address metadata: ${response.statusText}`,
    )
  }

  const payRequest = await response.json()
  const metadata = JSON.parse(payRequest.metadata)

  return {
    address: lightningAddress,
    username,
    domain,
    payRequest,
    metadata,
  }
}

self._validateLightningAddressAmount = (payRequest, amountMsats) => {
  const { minSendable, maxSendable } = payRequest
  if (amountMsats < minSendable) {
    throw new Error('Amount is below minimum for lightning address payment')
  }
  if (amountMsats > maxSendable) {
    throw new Error('Amount is above maximum for lightning address payment')
  }
}

self._requestLightningAddressInvoice = async (
  verification,
  amountMsats,
  comment,
) => {
  self._validateLightningAddressAmount(verification.payRequest, amountMsats)
  const callbackUrl = new URL(verification.payRequest.callback)
  callbackUrl.searchParams.set('amount', amountMsats.toString())
  if (comment) {
    callbackUrl.searchParams.set('comment', comment)
  }

  const response = await fetch(callbackUrl.toString())
  if (!response.ok) {
    throw new Error(
      `Failed to fetch lightning address invoice: ${response.statusText}`,
    )
  }

  const invoice = await response.json()

  if (invoice?.status === 'ERROR') {
    throw new Error(invoice.reason || 'Failed to pay lightning address')
  }

  return invoice
}

let rpcCallCounter = 0
const rpcSingle = (rpcHandler, request, callback) => {
  return new Promise((resolve, reject) => {
    const requestId = ++rpcCallCounter
    const rpcRequest = JSON.stringify({ request_id: requestId, ...request })

    rpcHandler.rpc(rpcRequest, (response) => {
      const parsed = JSON.parse(response)
      if (parsed.error !== undefined) {
        reject(parsed.error)
        return
      }

      if (parsed.data !== undefined) {
        resolve(parsed.data)
      }

      if (callback && parsed.end !== undefined) {
        callback()
      }
    })
  })
}

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
      const RpcHandler = (
        await import('@fedimint/fedimint-client-wasm-bundler')
      ).RpcHandler

      const root = await navigator.storage.getDirectory()
      // Allows to pass in a filename for testing
      const filename = payload?.filename || 'fedimint.db'
      dbFilename = filename
      const dbFileHandle = await root.getFileHandle(filename, {
        create: true,
      })
      dbSyncHandle = await dbFileHandle.createSyncAccessHandle()
      rpcHandler = new RpcHandler(dbSyncHandle)
      self.postMessage({
        type: 'initialized',
        data: { filename },
        request_id: requestId,
      })
    } else if (
      type === 'set_mnemonic' ||
      type === 'generate_mnemonic' ||
      type === 'get_mnemonic' ||
      type === 'join_federation' ||
      type === 'open_client' ||
      type === 'close_client' ||
      type === 'client_rpc' ||
      type === 'cancel_rpc' ||
      type === 'parse_invite_code' ||
      type === 'parse_bolt11_invoice' ||
      type === 'preview_federation'
    ) {
      self.postMessage({
        type: 'log',
        level: 'info',
        message: `RPC received`,
        request_type: type,
        requestId,
        payload,
      })
      if (!rpcHandler) {
        self.postMessage({
          type: 'error',
          error: 'rpcHandler not initialized',
          request_id: requestId,
        })
        return
      }

      if (
        type === 'client_rpc' &&
        payload?.module === 'ln' &&
        payload?.method === 'verify_lightning_address'
      ) {
        try {
          const verification = await self._resolveLightningAddress(
            payload.payload?.lightning_address,
          )

          self.postMessage({
            type: 'data',
            request_id: requestId,
            data: verification,
          })
          self.postMessage({ type: 'end', end: 'end', request_id: requestId })
        } catch (error) {
          self.postMessage({
            type: 'error',
            error: error?.message ?? String(error),
            request_id: requestId,
          })
        }
        return
      }

      if (
        type === 'client_rpc' &&
        payload?.module === 'ln' &&
        payload?.method === 'pay_lightning_address'
      ) {
        try {
          const verification = await self._resolveLightningAddress(
            payload.payload?.lightning_address,
          )
          const invoice = await self._requestLightningAddressInvoice(
            verification,
            payload.payload?.amount_msats,
            payload.payload?.comment,
          )

          const payment = await rpcSingle(rpcHandler, {
            type,
            module: 'ln',
            method: 'pay_bolt11_invoice',
            client_name: payload?.client_name,
            payload: {
              maybe_gateway: payload.payload?.gateway,
              invoice: invoice.pr,
              extra_meta: payload.payload?.extra_meta ?? {},
            },
          })

          self.postMessage({
            type: 'data',
            request_id: requestId,
            data: {
              invoice: invoice.pr,
              payment,
              successAction: invoice.successAction,
            },
          })
          self.postMessage({ type: 'end', end: 'end', request_id: requestId })
        } catch (error) {
          self.postMessage({
            type: 'error',
            error: error?.message ?? String(error),
            request_id: requestId,
          })
        }
        return
      }

      const rpcRequest = JSON.stringify({
        request_id: requestId,
        type,
        ...payload,
      })
      rpcHandler.rpc(rpcRequest, (response) =>
        self.postMessage(JSON.parse(response)),
      )
    } else if (type === 'cleanup') {
      console.log('cleanup message received')
      dbSyncHandle?.close()
      rpcHandler?.free()
      self.postMessage({
        type: 'cleanup',
        data: { filename: dbFilename },
        request_id: requestId,
      })
      close()
    } else {
      self.postMessage({
        type: 'error',
        error: 'Unknown message type',
        request_id: requestId,
      })
    }
  } catch (e) {
    console.error('ERROR', e)
    self.postMessage({ type: 'error', error: e.message, request_id: requestId })
  }
}

self.onerror = (e) => {
  self.postMessage({ type: 'error', error: e.message })
}
