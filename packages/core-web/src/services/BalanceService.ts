import { WorkerClient } from '../worker'

/**
 * Balance Service
 *
 * The Balance Service provides methods to interact with the balance of a Fedimint wallet.
 */
export class BalanceService {
  constructor(private client: WorkerClient) {}

  /** https://web.fedimint.org/core/FedimintWallet/BalanceService/getBalance */
  async getBalance(): Promise<number> {
    return await this.client.rpcSingle('', 'get_balance', {})
  }

  /** https://web.fedimint.org/core/FedimintWallet/BalanceService/subscribeBalance */
  subscribeBalance(
    onSuccess: (balanceMsats: number) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    const unsubscribe = this.client.rpcStream<string>(
      '',
      'subscribe_balance_changes',
      {},
      (res) => onSuccess(parseInt(res)),
      onError,
    )

    return unsubscribe
  }
}
