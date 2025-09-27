import { WasmWorkerTransport } from '@fedimint/transport-web'
import { Transport } from '../types'
import { WalletDirector } from '../WalletDirector'
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
