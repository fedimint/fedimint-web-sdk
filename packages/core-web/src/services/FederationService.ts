import type { JSONValue } from '../types'
import { RpcClient } from '../rpc'

export class FederationService {
  constructor(private client: RpcClient) {}

  async getConfig() {
    return await this.client.rpcSingle('', 'get_config', {})
  }

  async getFederationId() {
    return await this.client.rpcSingle<string>('', 'get_federation_id', {})
  }

  async getInviteCode(peer: number = 0) {
    return await this.client.rpcSingle<string | null>('', 'get_invite_code', {
      peer,
    })
  }

  async listOperations() {
    return await this.client.rpcSingle<JSONValue[]>('', 'list_operations', {})
  }
}
