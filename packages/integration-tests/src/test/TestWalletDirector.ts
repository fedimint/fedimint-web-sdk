import { WasmWorkerTransport } from '@fedimint/transport-web'
import { WalletDirector, type Transport } from '@fedimint/core-web'
import { TestFedimintWallet } from './TestFedimintWallet'

export class TestWalletDirector extends WalletDirector {
  constructor(client: Transport = new WasmWorkerTransport()) {
    super(client)
  }
  async createTestWallet() {
    await this._client.initialize()
    return new TestFedimintWallet(this._client)
  }
}
