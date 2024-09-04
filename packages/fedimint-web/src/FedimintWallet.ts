import init, { WasmClient } from '../wasm/fedimint_client_wasm.js'

type Body = string | null | Record<string, string>

export class FedimintWallet {
  // private _client: InitOutput;
  private _fed: WasmClient
  static initWasm = init

  private constructor(wasm: WasmClient) {
    this._fed = wasm
  }

  // Setup

  static async open(clientName: string) {
    const wasm = await WasmClient.open(clientName)
    if (wasm === undefined) return null
    return new FedimintWallet(wasm)
  }

  static async joinFederation(clientName: string, inviteCode: string) {
    const wasm = await WasmClient.join_federation(clientName, inviteCode)
    // console.warn('JOINED WASM', wasm)
    return new FedimintWallet(wasm)
  }

  // RPC

  private async _rpcSingle(module: string, method: string, body: Body = {}) {
    // console.warn('RPC', module, method, body)
    return new Promise((resolve) =>
      this._fed.rpc(module, method, JSON.stringify(body), (res: string) =>
        resolve(JSON.parse(res)),
      ),
    )
  }

  // Client

  async getBalance(): Promise<number> {
    return (await this._rpcSingle('', 'get_balance')) as number
  }

  // LN

  async payInvoice(invoice: string): Promise<void> {
    await this._rpcSingle('ln', 'pay_bolt11_invoice', {
      invoice,
    })
  }

  // async listGateways() {
  //   return await this._rpcSingle("ln", "list_gateways");
  // }
  // async verifyGateways() {
  //   return await this._rpcSingle("ln", "verify_gateway_availability");
  // }

  // Mint

  async reissueNotes(notes: string): Promise<void> {
    await this._rpcSingle('mint', 'reissue_external_notes', {
      notes,
    })
  }

  // Teardown
  async cleanup() {
    await this._fed.free()
  }
}
