import { WorkerClient } from '../worker'
import {
  CreateBolt11Response,
  GatewayInfo,
  JSONObject,
  JSONValue,
  LightningGateway,
  LnPayState,
  LnReceiveState,
  OutgoingLightningPayment,
} from '../types/wallet'

export class LightningService {
  constructor(private client: WorkerClient) {}

  async createInvoiceWithGateway(
    amount: number,
    description: string,
    expiryTime: number | null = null,
    extraMeta: JSONObject = {},
    gatewayInfo: GatewayInfo,
  ) {
    return await this.client.rpcSingle('ln', 'create_bolt11_invoice', {
      amount,
      description,
      expiry_time: expiryTime,
      extra_meta: extraMeta,
      gateway: gatewayInfo,
    })
  }

  async createInvoice(
    amount: number,
    description: string,
    expiryTime: number | null = null,
    extraMeta: JSONObject = {},
  ): Promise<CreateBolt11Response> {
    await this.updateGatewayCache()
    const gateway = await this._getDefaultGatewayInfo()
    return await this.client.rpcSingle('ln', 'create_bolt11_invoice', {
      amount,
      description,
      expiry_time: expiryTime,
      extra_meta: extraMeta,
      gateway: gateway.info,
    })
  }

  async payInvoiceWithGateway(
    invoice: string,
    gatewayInfo: GatewayInfo,
    extraMeta: JSONObject = {},
  ) {
    return await this.client.rpcSingle('ln', 'pay_bolt11_invoice', {
      maybe_gateway: gatewayInfo,
      invoice,
      extra_meta: extraMeta,
    })
  }

  private async _getDefaultGatewayInfo(): Promise<LightningGateway> {
    const gateways = await this.listGateways()
    return gateways[0]
  }

  async payInvoice(
    invoice: string,
    extraMeta: JSONObject = {},
  ): Promise<OutgoingLightningPayment> {
    await this.updateGatewayCache()
    const gateway = await this._getDefaultGatewayInfo()
    return await this.client.rpcSingle('ln', 'pay_bolt11_invoice', {
      maybe_gateway: gateway.info,
      invoice,
      extra_meta: extraMeta,
    })
  }

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

  async waitForReceive(operationId: string): Promise<LnReceiveState> {
    return new Promise((resolve, reject) => {
      const unsubscribe = this.subscribeLnReceive(
        operationId,
        (res) => {
          if (res === 'claimed') resolve(res)
        },
        reject,
      )
      setTimeout(() => {
        unsubscribe()
        reject(new Error('Timeout waiting for receive'))
      }, 10000)
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
