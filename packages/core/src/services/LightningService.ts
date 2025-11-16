import { TransportClient } from '../transport'
import type {
  CreateBolt11Response,
  GatewayInfo,
  JSONObject,
  LightningAddressInvoiceResponse,
  LightningAddressMetadata,
  LightningAddressPayRequest,
  LightningAddressSuccessAction,
  LightningAddressVerification,
  LightningGateway,
  LnInternalPayState,
  LnPayState,
  LnReceiveState,
  OutgoingLightningPayment,
} from '../types'

type PayLightningAddressOptions = {
  comment?: string
  extraMeta?: JSONObject
  gatewayInfo?: GatewayInfo
}

type PayLightningAddressResult = {
  invoice: string
  payment: OutgoingLightningPayment
  successAction?: LightningAddressSuccessAction
}

export class LightningService {
  constructor(
    private client: TransportClient,
    private clientName: string,
  ) {}

  /** https://sdk.fedimint.org/core/FedimintWallet/LightningService/createInvoice#lightning-createinvoice */
  async createInvoice(
    amountMsats: number,
    description: string,
    expiryTime?: number, // in seconds
    gatewayInfo?: GatewayInfo,
    extraMeta?: JSONObject,
  ) {
    const gateway = gatewayInfo ?? (await this._getDefaultGatewayInfo())
    return await this.client.rpcSingle<CreateBolt11Response>(
      'ln',
      'create_bolt11_invoice',
      {
        amount: amountMsats,
        description,
        expiry_time: expiryTime ?? null,
        extra_meta: extraMeta ?? {},
        gateway,
      },
      this.clientName,
    )
  }

  async createInvoiceTweaked(
    amountMsats: number,
    description: string,
    tweakKey: string,
    index: number,
    expiryTime?: number, // in seconds
    gatewayInfo?: GatewayInfo,
    extraMeta?: JSONObject,
  ) {
    const gateway = gatewayInfo ?? (await this._getDefaultGatewayInfo())
    return await this.client.rpcSingle<CreateBolt11Response>(
      'ln',
      'create_bolt11_invoice_for_user_tweaked',
      {
        amount: amountMsats,
        description,
        expiry_time: expiryTime ?? null,
        user_key: tweakKey,
        index,
        extra_meta: extraMeta ?? {},
        gateway,
      },
      this.clientName,
    )
  }

  // Returns the operation ids of payments received to the tweaks of the user secret key
  async scanReceivesForTweaks(
    tweakKey: string,
    indices: number[],
    extraMeta?: JSONObject,
  ) {
    return await this.client.rpcSingle<string[]>(
      'ln',
      'scan_receive_for_user_tweaked',
      {
        user_key: tweakKey,
        indices,
        extra_meta: extraMeta ?? {},
      },
      this.clientName,
    )
  }

  private async _getDefaultGatewayInfo() {
    await this.updateGatewayCache()
    const gateways = await this.listGateways()
    return gateways[0]?.info
  }

  /** https://sdk.fedimint.org/core/FedimintWallet/LightningService/payInvoice#lightning-payinvoice-invoice-string */
  async payInvoice(
    invoice: string,
    gatewayInfo?: GatewayInfo,
    extraMeta?: JSONObject,
  ) {
    const gateway = gatewayInfo ?? (await this._getDefaultGatewayInfo())
    return await this.client.rpcSingle<OutgoingLightningPayment>(
      'ln',
      'pay_bolt11_invoice',
      {
        maybe_gateway: gateway,
        invoice,
        extra_meta: extraMeta ?? {},
      },
      this.clientName,
    )
  }

  /** https://sdk.fedimint.org/core/FedimintWallet/LightningService/payInvoice#lightning-payinvoicesync-invoice-string */
  async payInvoiceSync(
    invoice: string,
    timeoutMs: number = 10000,
    gatewayInfo?: GatewayInfo,
    extraMeta?: JSONObject,
  ) {
    return new Promise<
      | { success: false; error?: string }
      | {
          success: true
          data: { feeMsats: number; preimage: string }
        }
    >(async (resolve, reject) => {
      const { contract_id, fee } = await this.payInvoice(
        invoice,
        gatewayInfo,
        extraMeta,
      )

      // TODO: handle  error handling for other subscription statuses
      const unsubscribe = this.subscribeLnPay(contract_id, (res) => {
        if (typeof res !== 'string' && 'success' in res) {
          clearTimeout(timeoutId)
          unsubscribe()
          resolve({
            success: true,
            data: { feeMsats: fee, preimage: res.success.preimage },
          })
        } else if (typeof res !== 'string' && 'unexpected_error' in res) {
          reject(new Error(res.unexpected_error.error_message))
        }
      })

      const timeoutId = setTimeout(() => {
        unsubscribe()
        resolve({ success: false, error: 'Payment timeout' })
      }, timeoutMs)
    })
  }

  subscribeInternalPayment(
    operation_id: string,
    onSuccess: (state: LnInternalPayState) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    return this.client.rpcStream(
      'ln',
      'subscribe_internal_pay',
      { operation_id: operation_id },
      this.clientName,
      onSuccess,
      onError,
    )
  }

  // TODO: Document
  subscribeLnClaim(
    operationId: string,
    onSuccess: (state: LnReceiveState) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    return this.client.rpcStream(
      'ln',
      'subscribe_ln_claim',
      { operation_id: operationId },
      this.clientName,
      onSuccess,
      onError,
    )
  }

  // TODO: Document (for external payments only)
  // TODO: Make this work for BOTH internal and external payments
  /** https://sdk.fedimint.org/core/FedimintWallet/LightningService/payInvoice#lightning-payinvoice-invoice-string */
  subscribeLnPay(
    operationId: string,
    onSuccess: (state: LnPayState) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    return this.client.rpcStream(
      'ln',
      'subscribe_ln_pay',
      { operation_id: operationId },
      this.clientName,
      onSuccess,
      onError,
    )
  }

  /** https://sdk.fedimint.org/core/FedimintWallet/LightningService/payInvoice#lightning-payinvoice-invoice-string */
  async waitForPay(operationId: string) {
    return new Promise<
      | { success: false; error?: string }
      | { success: true; data: { preimage: string } }
    >((resolve, reject) => {
      let unsubscribe: () => void
      const timeoutId = setTimeout(() => {
        resolve({ success: false, error: 'Waiting for receive timeout' })
      }, 15000)

      unsubscribe = this.subscribeLnPay(
        operationId,
        (res) => {
          if (typeof res !== 'string' && 'success' in res) {
            clearTimeout(timeoutId)
            unsubscribe()
            resolve({
              success: true,
              data: { preimage: res.success.preimage },
            })
          }
        },
        (error) => {
          clearTimeout(timeoutId)
          unsubscribe()
          reject(error)
        },
      )
    })
  }

  /** https://sdk.fedimint.org/core/FedimintWallet/LightningService/createInvoice#lightning-createinvoice */
  subscribeLnReceive(
    operationId: string,
    onSuccess: (state: LnReceiveState) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    return this.client.rpcStream(
      'ln',
      'subscribe_ln_receive',
      { operation_id: operationId },
      this.clientName,
      onSuccess,
      onError,
    )
  }

  /** https://sdk.fedimint.org/core/FedimintWallet/LightningService/createInvoice#lightning-createinvoice */
  async waitForReceive(operationId: string, timeoutMs: number = 15000) {
    return new Promise<LnReceiveState>((resolve, reject) => {
      let unsubscribe: () => void
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for receive'))
      }, timeoutMs)

      unsubscribe = this.subscribeLnReceive(
        operationId,
        (res) => {
          if (res === 'claimed') {
            clearTimeout(timeoutId)
            unsubscribe()
            resolve(res)
          }
        },
        (error) => {
          clearTimeout(timeoutId)
          unsubscribe()
          reject(error)
        },
      )
    })
  }

  async getGateway(
    gatewayId: string | null = null,
    forceInternal: boolean = false,
  ) {
    return await this.client.rpcSingle<LightningGateway | null>(
      'ln',
      'get_gateway',
      {
        gateway_id: gatewayId,
        force_internal: forceInternal,
      },
      this.clientName,
    )
  }

  async listGateways() {
    return await this.client.rpcSingle<LightningGateway[]>(
      'ln',
      'list_gateways',
      {},
      this.clientName,
    )
  }

  async updateGatewayCache() {
    return await this.client.rpcSingle(
      'ln',
      'update_gateway_cache',
      {},
      this.clientName,
    )
  }

  async verifyLightningAddress(
    lightningAddress: string,
  ): Promise<LightningAddressVerification> {
    const { username, domain, normalizedAddress } =
      this._normalizeLightningAddress(lightningAddress)
    const endpoints = this._buildLightningAddressUrls(domain, username)
    const errors: Error[] = []

    for (const endpoint of endpoints) {
      try {
        const payRequest = await this._fetchLightningAddressPayRequest(endpoint)
        const metadata = this._parseLightningAddressMetadata(
          payRequest.metadata,
        )
        return {
          address: normalizedAddress,
          username,
          domain,
          payRequest,
          metadata,
        }
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)))
      }
    }

    const message = errors.length
      ? errors.map((err) => err.message).join('; ')
      : 'Unknown error'
    throw new Error(
      `Failed to verify lightning address ${normalizedAddress}: ${message}`,
    )
  }

  async payLightningAddress(
    lightningAddress: string,
    amountMsats: number,
    options: PayLightningAddressOptions = {},
  ): Promise<PayLightningAddressResult> {
    if (!Number.isFinite(amountMsats) || amountMsats <= 0) {
      throw new Error('Amount must be a positive number of millisatoshis')
    }

    const verification = await this.verifyLightningAddress(lightningAddress)
    const { payRequest } = verification

    if (
      amountMsats < payRequest.minSendable ||
      amountMsats > payRequest.maxSendable
    ) {
      throw new Error(
        `Amount must be between ${payRequest.minSendable} and ${payRequest.maxSendable} millisatoshis`,
      )
    }

    if (options.comment) {
      const limit = payRequest.commentAllowed ?? 0
      if (limit === 0) {
        throw new Error('This lightning address does not accept comments')
      }
      if (options.comment.length > limit) {
        throw new Error(
          `Comment length exceeds the allowed limit of ${limit} characters`,
        )
      }
    }

    const callbackUrl = new URL(payRequest.callback)
    callbackUrl.searchParams.set('amount', amountMsats.toString())
    if (options.comment) {
      callbackUrl.searchParams.set('comment', options.comment)
    }

    const invoiceResponse =
      await this._fetchLightningAddressInvoice(callbackUrl)
    const payment = await this.payInvoice(
      invoiceResponse.pr,
      options.gatewayInfo,
      options.extraMeta,
    )

    return {
      invoice: invoiceResponse.pr,
      payment,
      successAction: invoiceResponse.successAction,
    }
  }

  private _normalizeLightningAddress(address: string): {
    username: string
    domain: string
    normalizedAddress: string
  } {
    if (!address || typeof address !== 'string') {
      throw new Error('Lightning address is required')
    }

    const trimmed = address.trim()
    const [username, domain, ...rest] = trimmed.split('@')
    if (!username || !domain || rest.length > 0) {
      throw new Error('Lightning address must be in the format name@domain')
    }

    const normalizedDomain = domain.toLowerCase()

    return {
      username,
      domain: normalizedDomain,
      normalizedAddress: `${username}@${normalizedDomain}`,
    }
  }

  private _buildLightningAddressUrls(domain: string, username: string): URL[] {
    const encodedUsername = encodeURIComponent(username)
    const base = domain.includes('://') ? domain : `https://${domain}`
    const prefixes = ['/.well-known/lnurlp', '/lnurlp']

    return prefixes.map((prefix) => {
      const url = new URL(base)
      const cleanPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
      url.pathname = `${cleanPrefix}/${encodedUsername}`
      url.search = ''
      return url
    })
  }

  private async _fetchLightningAddressPayRequest(
    url: URL,
  ): Promise<LightningAddressPayRequest> {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error(
        `Lightning address endpoint ${url.toString()} returned ${response.status}`,
      )
    }

    const payload = (await response.json()) as unknown
    return this._validateLightningAddressPayRequest(payload)
  }

  private _validateLightningAddressPayRequest(
    payload: unknown,
  ): LightningAddressPayRequest {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid lightning address response: expected an object')
    }

    const {
      tag,
      callback,
      maxSendable,
      minSendable,
      metadata,
      commentAllowed,
      payerData,
      allowsNostr,
      nostrPubkey,
      disposable,
    } = payload as Record<string, unknown>

    if (tag !== 'payRequest') {
      throw new Error(
        'Invalid lightning address response: expected tag payRequest',
      )
    }

    if (typeof callback !== 'string') {
      throw new Error(
        'Invalid lightning address response: missing callback URL',
      )
    }

    // Validate callback URL
    let validatedCallback: string
    try {
      validatedCallback = new URL(callback).toString()
    } catch {
      throw new Error(
        'Invalid lightning address response: callback must be a valid URL',
      )
    }

    if (typeof maxSendable !== 'number' || typeof minSendable !== 'number') {
      throw new Error(
        'Invalid lightning address response: invalid sendable range',
      )
    }

    if (typeof metadata !== 'string') {
      throw new Error(
        'Invalid lightning address response: metadata must be a string',
      )
    }

    const normalizedComment =
      typeof commentAllowed === 'number' ? commentAllowed : undefined
    const normalizedPayerData =
      payerData && typeof payerData === 'object' ? payerData : undefined

    return {
      tag: 'payRequest',
      callback: validatedCallback,
      maxSendable,
      minSendable,
      metadata,
      commentAllowed: normalizedComment,
      payerData: normalizedPayerData as LightningAddressPayRequest['payerData'],
      allowsNostr: typeof allowsNostr === 'boolean' ? allowsNostr : undefined,
      nostrPubkey: typeof nostrPubkey === 'string' ? nostrPubkey : undefined,
      disposable: typeof disposable === 'boolean' ? disposable : undefined,
    }
  }

  private _parseLightningAddressMetadata(
    metadata: string,
  ): LightningAddressMetadata {
    try {
      const parsed = JSON.parse(metadata)
      if (!Array.isArray(parsed)) {
        throw new Error('Metadata must be an array')
      }

      return parsed.map((entry) => {
        if (!Array.isArray(entry) || entry.length < 2) {
          throw new Error('Metadata entries must be arrays')
        }
        const [type, value] = entry
        if (typeof type !== 'string' || typeof value !== 'string') {
          throw new Error('Metadata entries must contain string values')
        }
        return [type, value] as [string, string]
      })
    } catch (error) {
      throw new Error(
        `Invalid lightning address metadata: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }

  private async _fetchLightningAddressInvoice(
    url: URL,
  ): Promise<LightningAddressInvoiceResponse> {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error(
        `Lightning address callback ${url.toString()} returned ${response.status}`,
      )
    }

    const payload = (await response.json()) as
      | LightningAddressInvoiceResponse
      | {
          status?: string
          reason?: string
        }

    if (
      payload &&
      typeof payload === 'object' &&
      'status' in payload &&
      payload.status === 'ERROR'
    ) {
      throw new Error(
        `Lightning address callback error: ${payload.reason ?? 'Unknown error'}`,
      )
    }

    if (!payload || typeof payload !== 'object' || !('pr' in payload)) {
      throw new Error('Invalid lightning address callback response')
    }

    if (typeof payload.pr !== 'string') {
      throw new Error(
        'Lightning address callback response is missing an invoice',
      )
    }

    return payload as LightningAddressInvoiceResponse
  }
}

export type { PayLightningAddressOptions, PayLightningAddressResult }
