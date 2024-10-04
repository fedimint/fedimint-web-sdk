import { JSONValue } from '../types/wallet'
import { WorkerClient } from '../worker'
import { Base } from '../Base'

const DEFAULT_CLIENT_NAME = 'fm-federation-client' as const

export class Federation extends Base {
  constructor(client?: WorkerClient, lazy: boolean = false) {
    super(client, lazy)
  }

  async open(clientName: string = DEFAULT_CLIENT_NAME): Promise<boolean> {
    return super.open(clientName)
  }

  async joinFederation(
    inviteCode: string,
    clientName: string = DEFAULT_CLIENT_NAME,
  ): Promise<void> {
    return super.joinFederation(inviteCode, clientName)
  }

  async getConfig(): Promise<JSONValue> {
    return await this.client.rpcSingle('', 'get_config', {})
  }

  async getFederationId(): Promise<string> {
    return await this.client.rpcSingle('', 'get_federation_id', {})
  }

  async getInviteCode(peer: number): Promise<string | null> {
    return await this.client.rpcSingle('', 'get_invite_code', { peer })
  }

  async listOperations(): Promise<JSONValue[]> {
    return await this.client.rpcSingle('', 'list_operations', {})
  }
}
