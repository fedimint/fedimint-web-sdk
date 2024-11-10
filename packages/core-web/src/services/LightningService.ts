import { WorkerClient } from '../worker'
import type {
  CreateBolt11Response,
  GatewayInfo,
  JSONObject,
  JSONValue,
  LightningGateway,
  LnPayState,
  LnReceiveState,
  OutgoingLightningPayment,
} from '../types'

export class LightningService {
  constructor(private client: WorkerClient) {}

  async createInvoice(
    amountMsats: number,
    description: string,
    expiryTime?: number, // in seconds
    gatewayInfo?: GatewayInfo,
    extraMeta?: JSONObject,
  ): Promise<CreateBolt11Response> {
    const gateway = gatewayInfo ?? (await this._getDefaultGatewayInfo())
    return await this.client.rpcSingle('ln', 'create_bolt11_invoice', {
      amount: amountMsats,
      description,
      expiry_time: expiryTime ?? null,
      extra_meta: extraMeta ?? {},
      gateway,
    })
  }

  async createInvoiceTweaked(
    amountMsats: number,
    description: string,
    tweakKey: string,
    index: number,
    expiryTime?: number, // in seconds
    gatewayInfo?: GatewayInfo,
    extraMeta?: JSONObject,
  ): Promise<CreateBolt11Response> {
    const gateway = gatewayInfo ?? (await this._getDefaultGatewayInfo())
    return await this.client.rpcSingle(
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
    )
  }

  // Returns the operation ids of payments received to the tweaks of the user secret key
  async scanReceivesForTweaks(
    tweakKey: string,
    indices: number[],
    extraMeta?: JSONObject,
  ): Promise<string[]> {
    return await this.client.rpcSingle('ln', 'scan_receive_for_user_tweaked', {
      user_key: tweakKey,
      indices,
      extra_meta: extraMeta ?? {},
    })
  }

  private async _getDefaultGatewayInfo(): Promise<GatewayInfo> {
    await this.updateGatewayCache()
    const gateways = await this.listGateways()
    return gateways[0]?.info
  }

  async payInvoice(
    invoice: string,
    gatewayInfo?: GatewayInfo,
    extraMeta?: JSONObject,
  ): Promise<OutgoingLightningPayment> {
    const gateway = gatewayInfo ?? (await this._getDefaultGatewayInfo())
    return await this.client.rpcSingle('ln', 'pay_bolt11_invoice', {
      maybe_gateway: gateway,
      invoice,
      extra_meta: extraMeta ?? {},
    })
  }

  async payInvoiceSync(
    invoice: string,
    timeoutMs: number = 10000,
    gatewayInfo?: GatewayInfo,
    extraMeta?: JSONObject,
  ): Promise<
    | { success: false }
    | {
        success: true
        data: { feeMsats: number; preimage: string }
      }
  > {
    return new Promise(async (resolve, reject) => {
      const { contract_id, fee } = await this.payInvoice(
        invoice,
        gatewayInfo,
        extraMeta,
      )

      const unsubscribe = this.subscribeLnPay(contract_id, (res) => {
        if (typeof res !== 'string' && 'success' in res) {
          clearTimeout(timeoutId)
          unsubscribe()
          resolve({
            success: true,
            data: { feeMsats: fee, preimage: res.success.preimage },
          })
        }
      })

      const timeoutId = setTimeout(() => {
        unsubscribe()
        reject(new Error('Timeout waiting for pay'))
      }, timeoutMs)
    })
  }

  // TODO: Document
  subscribeLnClaim(
    operationId: string,
    onSuccess: (state: LnReceiveState) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this.client.rpcStream(
      'ln',
      'subscribe_ln_claim',
      { operation_id: operationId },
      onSuccess,
      onError,
    )

    return unsubscribe
  }

  // TODO: Document (for external payments only)
  // TODO: Make this work for BOTH internal and external payments
  subscribeLnPay(
    operationId: string,
    onSuccess: (state: LnPayState) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this.client.rpcStream(
      'ln',
      'subscribe_ln_pay',
      { operation_id: operationId },
      onSuccess,
      onError,
    )

    return unsubscribe
  }

  async waitForPay(operationId: string): Promise<
    | { success: false }
    | {
        success: true
        data: { preimage: string }
      }
  > {
    return new Promise((resolve, reject) => {
      let unsubscribe: () => void
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for receive'))
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

  // TODO: Document
  subscribeLnReceive(
    operationId: string,
    onSuccess: (state: LnReceiveState) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this.client.rpcStream(
      'ln',
      'subscribe_ln_receive',
      { operation_id: operationId },
      onSuccess,
      onError,
    )

    return unsubscribe
  }

  async waitForReceive(
    operationId: string,
    timeoutMs: number = 15000,
  ): Promise<LnReceiveState> {
    return new Promise((resolve, reject) => {
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
  ): Promise<LightningGateway | null> {
    return await this.client.rpcSingle('ln', 'get_gateway', {
      gateway_id: gatewayId,
      force_internal: forceInternal,
    })
  }

  async listGateways(): Promise<LightningGateway[]> {
    return await this.client.rpcSingle('ln', 'list_gateways', {})
  }

  async updateGatewayCache(): Promise<JSONValue> {
    return await this.client.rpcSingle('ln', 'update_gateway_cache', {})
  }
}
