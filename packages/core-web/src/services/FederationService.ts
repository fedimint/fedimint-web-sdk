import { JSONValue } from '../types/wallet'
import { WorkerClient } from '../worker'

export class FederationService {
  constructor(private client: WorkerClient) {}

  async getConfig(): Promise<JSONValue> {
    return await this.client.rpcSingle('', 'get_config', {})
  }

  async getFederationId(): Promise<string> {
    return await this.client.rpcSingle('', 'get_federation_id', {})
  }

  async getInviteCode(peer: number): Promise<string | null> {
    return await this.client.rpcSingle('', 'get_invite_code', { peer })
  }

  async joinFederation(inviteCode: string, clientName: string): Promise<void> {
    const response = await this.client.sendSingleMessage('join', {
      inviteCode,
      clientName,
    })
    if (!response.success) {
      throw new Error('Failed to join federation')
    }
  }

  async listOperations(): Promise<JSONValue[]> {
    return await this.client.rpcSingle('', 'list_operations', {})
  }
}
