import { WalletSummary } from '../types'
import { WorkerClient } from '../worker'

export class WalletService {
  constructor(private client: WorkerClient) {}

  async getWalletSummary(): Promise<WalletSummary> {
    return await this.client.rpcSingle('wallet', 'get_wallet_summary', {})
  }
}
