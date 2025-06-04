import { JSONValue, WalletSummary, PegInResponse } from '../types'
import { WorkerClient } from '../worker'

export class WalletService {
  constructor(private client: WorkerClient) {}

  async getWalletSummary(): Promise<WalletSummary> {
    return await this.client.rpcSingle('wallet', 'get_wallet_summary', {})
  }

  async generateAddress(extraMeta: JSONValue = {}) {
    return await this.client.rpcSingle<PegInResponse>('wallet', 'peg_in', {
      extra_meta: extraMeta,
    })
  }

  async withdraw(
    amountSat: number,
    address: string,
    extraMeta: JSONValue = {},
  ): Promise<{ operation_id: string }> {
    return await this.client.rpcSingle('wallet', 'peg_out', {
      amount_sat: amountSat,
      destination_address: address,
      extra_meta: extraMeta,
    })
  }
}
