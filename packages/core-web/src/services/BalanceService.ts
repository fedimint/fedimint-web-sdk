import { WorkerClient } from '../transport'

export class BalanceService {
  constructor(private client: WorkerClient) {}

  async getBalance(): Promise<number> {
    return await this.client.rpcSingle('', 'get_balance', {})
  }

  subscribeBalance(
    onSuccess: (balance: number) => void = () => {},
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
