import { RpcClient } from '../rpc'

/**
 * Balance Service
 *
 * The Balance Service provides methods to interact with the balance of a Fedimint wallet.
 */
export class BalanceService {
  constructor(private client: RpcClient) {}

  /** https://web.fedimint.org/core/FedimintWallet/BalanceService/getBalance */
  async getBalance() {
    return await this.client.rpcSingle<number>('', 'get_balance', {})
  }

  /** https://web.fedimint.org/core/FedimintWallet/BalanceService/subscribeBalance */
  subscribeBalance(
    onSuccess: (balanceMsats: number) => void = () => {},
    onError: (error: string) => void = () => {},
  ) {
    return this.client.rpcStream<string>(
      '',
      'subscribe_balance_changes',
      {},
      (res) => onSuccess(parseInt(res)),
      onError,
    )
  }
}
