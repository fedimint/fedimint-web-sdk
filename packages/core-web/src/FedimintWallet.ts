import init, { RpcHandle, WasmClient } from '../wasm/fedimint_client_wasm.js'
import {
  JSONValue,
  JSONObject,
  LightningGateway,
  OutgoingLightningPayment,
  LnPayState,
  LnReceiveState,
  StreamResult,
  StreamError,
  CreateBolt11Response,
  ModuleKind,
  GatewayInfo,
} from './types/wallet.js'

const DEFAULT_CLIENT_NAME = 'fm-default' as const

export class FedimintWallet {
  private _fed: WasmClient | null = null
  private initPromise: Promise<void> | null = null
  private openPromise: Promise<void> | null = null
  private resolveOpen: () => void = () => {}

  constructor(lazy: boolean = false) {
    if (lazy) return
    this.initialize()
    this.openPromise = new Promise((resolve) => {
      this.resolveOpen = resolve
    })
  }

  // Setup
  async initialize() {
    if (this.initPromise) return this.initPromise
    // this.worker = new Worker(new URL('./wasm.worker.ts', import.meta.url))
    this.initPromise = init().then(() => {
      console.trace('Fedimint Client Wasm Initialization complete')
    })
    return this.initPromise
  }

  async open(clientName: string = DEFAULT_CLIENT_NAME) {
    await this.initialize()
    const wasm = await WasmClient.open(clientName)

    if (wasm === undefined) return false
    this._fed = wasm
    this.resolveOpen()
    return true
  }

  async joinFederation(
    inviteCode: string,
    clientName: string = DEFAULT_CLIENT_NAME,
  ) {
    await this.initialize()
    this._fed = await WasmClient.join_federation(clientName, inviteCode)
    this.resolveOpen()
  }

  // RPC
  private async _rpcStream<
    Response extends JSONValue = JSONValue,
    Body extends JSONValue = JSONValue,
  >(
    module: ModuleKind,
    method: string,
    body: Body,
    onSuccess: (res: Response) => void,
    onError: (res: StreamError['error']) => void,
  ): Promise<RpcHandle> {
    await this.openPromise
    if (!this._fed) throw new Error('FedimintWallet is not open')
    const unsubscribe = await this._fed.rpc(
      module,
      method,
      JSON.stringify(body),
      (res: string) => {
        // TODO: Validate the response?
        const parsed = JSON.parse(res) as StreamResult<Response>
        if (parsed.error) {
          onError(parsed.error)
        } else {
          onSuccess(parsed.data)
        }
      },
    )
    return unsubscribe
  }

  private async _rpcSingle<Response extends JSONValue = JSONValue>(
    module: ModuleKind,
    method: string,
    body: JSONValue,
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      if (!this._fed) return reject('FedimintWallet is not open')
      this._fed.rpc(module, method, JSON.stringify(body), (res: string) => {
        // TODO: Validate the response?
        const parsed = JSON.parse(res) as StreamResult<Response>
        if (parsed.error) {
          reject(parsed.error)
        } else {
          resolve(parsed.data)
        }
      })
    })
  }

  async getBalance(): Promise<number> {
    return await this._rpcSingle('', 'get_balance', {})
  }

  // Mint module methods

  async redeemEcash(notes: string): Promise<void> {
    await this._rpcSingle('mint', 'reissue_external_notes', {
      oob_notes: notes, // "out of band notes"
      extra_meta: null,
    })
  }

  async reissueExternalNotes(
    oobNotes: string,
    extraMeta: JSONObject,
  ): Promise<string> {
    return await this._rpcSingle('mint', 'reissue_external_notes', {
      oob_notes: oobNotes,
      extra_meta: extraMeta,
    })
  }

  subscribeReissueExternalNotes(
    operationId: string,
    onSuccess: (state: JSONValue) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    type ReissueExternalNotesState =
      | 'Created'
      | 'Issuing'
      | 'Done'
      | { Failed: { error: string } }

    const unsubscribe = this._rpcStream<ReissueExternalNotesState>(
      'mint',
      'subscribe_reissue_external_notes',
      { operation_id: operationId },
      (res) => onSuccess(res),
      onError,
    )

    return () => {
      unsubscribe.then((unsub) => {
        unsub.cancel()
        unsub.free()
      })
    }
  }

  async spendNotes(
    minAmount: number,
    tryCancelAfter: number,
    includeInvite: boolean,
    extraMeta: JSONValue,
  ): Promise<JSONValue> {
    return await this._rpcSingle('mint', 'spend_notes', {
      min_amount: minAmount,
      try_cancel_after: tryCancelAfter,
      include_invite: includeInvite,
      extra_meta: extraMeta,
    })
  }

  async validateNotes(oobNotes: string): Promise<number> {
    return await this._rpcSingle('mint', 'validate_notes', {
      oob_notes: oobNotes,
    })
  }

  async tryCancelSpendNotes(operationId: string): Promise<void> {
    await this._rpcSingle('mint', 'try_cancel_spend_notes', {
      operation_id: operationId,
    })
  }

  subscribeSpendNotes(
    operationId: string,
    onSuccess: (state: JSONValue) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this._rpcStream(
      'mint',
      'subscribe_spend_notes',
      { operation_id: operationId },
      (res) => onSuccess(res),
      onError,
    )

    return () => {
      unsubscribe.then((unsub) => {
        unsub.cancel()
        unsub.free()
      })
    }
  }

  async awaitSpendOobRefund(operationId: string): Promise<JSONValue> {
    return await this._rpcSingle('mint', 'await_spend_oob_refund', {
      operation_id: operationId,
    })
  }

  /**
   * This should ONLY be called when UNLOADING the wallet client.
   * After this call, the FedimintWallet instance should be discarded.
   */
  async cleanup() {
    await this._fed?.free()
    this._fed = null
    this.openPromise = null
  }

  isOpen() {
    return this._fed !== null
  }

  async getConfig(): Promise<JSONValue> {
    return await this._rpcSingle('', 'get_config', {})
  }

  async getFederationId(): Promise<string> {
    return await this._rpcSingle('', 'get_federation_id', {})
  }

  async getInviteCode(peer: number): Promise<string | null> {
    return await this._rpcSingle('', 'get_invite_code', { peer })
  }

  async listOperations(): Promise<JSONValue[]> {
    return await this._rpcSingle('', 'list_operations', {})
  }

  async hasPendingRecoveries(): Promise<boolean> {
    return await this._rpcSingle('', 'has_pending_recoveries', {})
  }

  async waitForAllRecoveries(): Promise<void> {
    await this._rpcSingle('', 'wait_for_all_recoveries', {})
  }

  /// STREAMING RPCs --------------------

  subscribeBalance(
    onSuccess: (balance: number) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this._rpcStream<string>(
      '',
      'subscribe_balance_changes',
      {},
      (res) => onSuccess(parseInt(res)),
      onError,
    )

    return () => {
      unsubscribe.then((unsub) => {
        unsub.cancel()
        unsub.free()
      })
    }
  }

  subscribeToRecoveryProgress(
    onSuccess: (progress: {
      module_id: number
      progress: JSONValue
    }) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this._rpcStream<{
      module_id: number
      progress: JSONValue
    }>('', 'subscribe_to_recovery_progress', {}, onSuccess, onError)

    return () => {
      unsubscribe.then((unsub) => {
        unsub.cancel()
        unsub.free()
      })
    }
  }

  // Lightning Network module methods

  async createBolt11InvoiceWithGateway(
    amount: number,
    description: string,
    expiryTime: number | null = null,
    extraMeta: JSONObject = {},
    gatewayInfo: GatewayInfo,
  ) {
    return await this._rpcSingle('ln', 'create_bolt11_invoice', {
      amount,
      description,
      expiry_time: expiryTime,
      extra_meta: extraMeta,
      gateway: gatewayInfo,
    })
  }

  async createBolt11Invoice(
    amount: number,
    description: string,
    expiryTime: number | null = null,
    extraMeta: JSONObject = {},
  ): Promise<CreateBolt11Response> {
    await this.updateGatewayCache()
    const gateway = await this._getDefaultGatewayInfo()
    return await this._rpcSingle('ln', 'create_bolt11_invoice', {
      amount,
      description,
      expiry_time: expiryTime,
      extra_meta: extraMeta,
      gateway,
    })
  }

  async payBolt11InvoiceWithGateway(
    invoice: string,
    gatewayInfo: GatewayInfo,
    extraMeta: JSONObject = {},
  ) {
    return await this._rpcSingle('ln', 'pay_bolt11_invoice', {
      maybe_gateway: gatewayInfo,
      invoice,
      extra_meta: extraMeta,
    })
  }

  async _getDefaultGatewayInfo(): Promise<LightningGateway> {
    const gateways = await this.listGateways()
    return gateways[0]
  }

  async payBolt11Invoice(
    invoice: string,
    extraMeta: JSONObject = {},
  ): Promise<OutgoingLightningPayment> {
    await this.updateGatewayCache()
    const gateway = await this._getDefaultGatewayInfo()
    return await this._rpcSingle('ln', 'pay_bolt11_invoice', {
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
    const unsubscribe = this._rpcStream(
      'ln',
      'subscribe_ln_pay',
      { operation_id: operationId },
      onSuccess,
      onError,
    )

    return () => {
      unsubscribe.then((unsub) => {
        unsub.cancel()
        unsub.free()
      })
    }
  }

  subscribeLnReceive(
    operationId: string,
    onSuccess: (state: LnReceiveState) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this._rpcStream(
      'ln',
      'subscribe_ln_receive',
      { operation_id: operationId },
      onSuccess,
      onError,
    )

    return () => {
      unsubscribe.then((unsub) => {
        unsub.cancel()
        unsub.free()
      })
    }
  }

  async getGateway(
    gatewayId: string | null = null,
    forceInternal: boolean = false,
  ): Promise<LightningGateway | null> {
    return await this._rpcSingle('ln', 'get_gateway', {
      gateway_id: gatewayId,
      force_internal: forceInternal,
    })
  }

  async listGateways(): Promise<LightningGateway[]> {
    return await this._rpcSingle('ln', 'list_gateways', {})
  }

  async updateGatewayCache(): Promise<void> {
    console.trace('Updating gateway cache')
    await this._rpcSingle('ln', 'update_gateway_cache', {})
  }
}
