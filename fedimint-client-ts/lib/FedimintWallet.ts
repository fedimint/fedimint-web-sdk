import fedimint, { WasmClient } from "fedimint-client-wasm";
export class FedimintWallet {
  // private _client: InitOutput;
  private _fed: WasmClient;
  static initFedimint = fedimint;

  private constructor(wasm: WasmClient) {
    this._fed = wasm;
  }

  // Setup

  static async open() {
    await fedimint();
    const wasm = await WasmClient.open();
    if (wasm === undefined) return null;
    return new FedimintWallet(wasm);
  }

  static async joinFederation(inviteCode: string) {
    await fedimint();
    const wasm = await WasmClient.join_federation(inviteCode);
    return new FedimintWallet(wasm);
  }

  // RPC

  private async _rpcSingle(module: string, method: string, body: any = null) {
    return new Promise((resolve) =>
      this._fed.rpc(module, method, JSON.stringify(body), (res: string) =>
        resolve(JSON.parse(res))
      )
    );
  }

  // Client

  async getBalance(): Promise<number> {
    return (await this._rpcSingle("client", "get_balance")) as number;
  }

  // LN

  async payInvoice(invoice: string): Promise<void> {
    return (await this._rpcSingle("ln", "pay_bolt11_invoice", {
      invoice,
    })) as void;
  }

  // async listGateways() {
  //   return await this._rpcSingle("ln", "list_gateways");
  // }
  // async verifyGateways() {
  //   return await this._rpcSingle("ln", "verify_gateway_availability");
  // }

  // Mint

  async reissueNotes(notes: string): Promise<void> {
    return (await this._rpcSingle("mint", "reissue_external_notes", {
      notes,
    })) as void;
  }
}
