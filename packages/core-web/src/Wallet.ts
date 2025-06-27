import { RpcClient } from './rpc'
import {
  BalanceService,
  MintService,
  LightningService,
  FederationService,
  RecoveryService,
  WalletService,
} from './services'
import { logger } from './utils/logger'
import { generateUUID } from './utils/uuid'

export class Wallet {
  public readonly id: string
  private _client: RpcClient
  private _clientName: string
  private _federationId: string

  public balance: BalanceService
  public mint: MintService
  public lightning: LightningService
  public federation: FederationService
  public recovery: RecoveryService
  public wallet: WalletService

  constructor(client: RpcClient, federationId: string, walletId?: string) {
    this.id = walletId || generateUUID()
    this._client = client
    this._clientName = `wallet-${this.id}`
    this._federationId = federationId

    this.balance = new BalanceService(this._client, this._clientName)
    this.mint = new MintService(this._client, this._clientName)
    this.lightning = new LightningService(this._client, this._clientName)
    this.federation = new FederationService(this._client, this._clientName)
    this.recovery = new RecoveryService(this._client, this._clientName)
    this.wallet = new WalletService(this._client, this._clientName)

    logger.info(`Wallet ${this.id} opened for federation ${this._federationId}`)
  }

  get federationId(): string {
    return this._federationId
  }

  get clientName(): string {
    return this._clientName
  }

  /**
   * Cleans up the wallet resources.
   *
   * This method closes the client and removes the wallet
   * from the WalletManager. It should be called when the wallet is no longer needed.
   *
   * @returns {Promise<void>} A promise that resolves when the cleanup is complete.
   */
  async cleanup(): Promise<void> {
    try {
      await this._client.closeClient(this._clientName)
      logger.info(`Wallet ${this.id} cleaned up`)
    } catch (error) {
      logger.error(`Error cleaning up wallet ${this.id}:`, error)
    }
  }
}
