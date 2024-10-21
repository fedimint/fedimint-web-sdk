import type { RpcFederationMaybeLoading } from '../types'
import { WorkerClient } from '../worker'

export class FederationService {
  constructor(private client: WorkerClient) {}

  async getConfig(): Promise<RpcFederationMaybeLoading> {
    return await this.client.rpcSingle('', 'get_config', {})
  }

  async getFederationId(): Promise<string> {
    return await this.client.rpcSingle('', 'get_federation_id', {})
  }

  async getInviteCode(peer: number): Promise<string | null> {
    return await this.client.rpcSingle('', 'get_invite_code', { peer })
  }

  async listOperations(): Promise<RpcFederationMaybeLoading[]> {
    return await this.client.rpcSingle('', 'list_operations', {})
  }
}
