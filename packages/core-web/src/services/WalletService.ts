import { WalletDepositState, WalletSummary } from '../types'
import { WorkerClient } from '../worker'

export class WalletService {
  constructor(private client: WorkerClient) {}

  async getWalletSummary(): Promise<WalletSummary> {
    return await this.client.rpcSingle('wallet', 'get_wallet_summary', {})
  }
  subscribeDeposit(
    operation_id: string,
    onSuccess: (state: WalletDepositState) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    return this.client.rpcStream(
      'ln',
      'subscribe_deposit',
      { operation_id: operation_id },
      onSuccess,
      onError,
    )
  }
}
