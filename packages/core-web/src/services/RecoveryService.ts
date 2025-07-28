import type { JSONValue } from '../types'
import { RpcClient } from '../rpc'

export class RecoveryService {
  constructor(
    private client: RpcClient,
    private clientName: string,
  ) {}

  async hasPendingRecoveries() {
    return await this.client.rpcSingle<boolean>(
      '',
      'has_pending_recoveries',
      {},
      this.clientName,
    )
  }

  async waitForAllRecoveries() {
    await this.client.rpcSingle(
      '',
      'wait_for_all_recoveries',
      {},
      this.clientName,
    )
  }

  subscribeToRecoveryProgress(
    onSuccess: (progress: { module_id: number; progress: JSONValue }) => void,
    onError: (error: string) => void,
  ) {
    return this.client.rpcStream<{
      module_id: number
      progress: JSONValue
    }>(
      '',
      'subscribe_to_recovery_progress',
      {},
      onSuccess,
      onError,
      () => {},
      this.clientName,
    )
  }

  async backupToFederation(metadata: JSONValue) {
    return await this.client.rpcSingle(
      '',
      'backup_to_federation',
      { metadata },
      this.clientName,
    )
  }
}
