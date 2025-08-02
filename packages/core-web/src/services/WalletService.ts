import {
  JSONValue,
  WalletSummary,
  GenerateAddressResponse,
  WalletDepositState,
} from '../types'
import { RpcClient } from '../rpc'

export class WalletService {
  constructor(
    private client: RpcClient,
    private clientName: string,
  ) {}

  async getWalletSummary(): Promise<WalletSummary> {
    return await this.client.rpcSingle('wallet', 'get_wallet_summary', {})
  }

  async generateAddress(extraMeta: JSONValue = {}) {
    return await this.client.rpcSingle<GenerateAddressResponse>(
      'wallet',
      'peg_in',
      {
        extra_meta: extraMeta,
      },
    )
  }

  async sendOnchain(
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
