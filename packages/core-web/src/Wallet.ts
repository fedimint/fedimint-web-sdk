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
import { WalletRegistry } from './WalletRegistry'

export class Wallet {
  public readonly id: string
  private _client: RpcClient
  private _clientName: string
  private _federationId?: string
  private _isOpen: boolean = false
  private _openPromise: Promise<void> | undefined = undefined
  private _resolveOpen: () => void = () => {}

  public balance: BalanceService
  public mint: MintService
  public lightning: LightningService
  public federation: FederationService
  public recovery: RecoveryService
  public wallet: WalletService

  constructor(client: RpcClient, walletId?: string) {
    this.id = walletId || generateUUID()
    this._client = client
    this._clientName = `wallet-${this.id}`

    this._openPromise = new Promise((resolve) => {
      this._resolveOpen = resolve
    })

    // nit: are both the client and clientName needed?, or would just the clientName suffice?
    // might be backwards compatible if we keep both
    this.balance = new BalanceService(this._client, this._clientName)
    this.mint = new MintService(this._client, this._clientName)
    this.lightning = new LightningService(this._client, this._clientName)
    this.federation = new FederationService(this._client, this._clientName)
    this.recovery = new RecoveryService(this._client, this._clientName)
    this.wallet = new WalletService(this._client, this._clientName)

    // Register wallet
    WalletRegistry.getInstance().addWallet(this)

    logger.info(`Wallet ${this.id} instantiated`)
  }

  get federationId(): string | undefined {
    return this._federationId
  }

  get clientName(): string {
    return this._clientName
  }

  async waitForOpen(): Promise<void> {
    if (this._isOpen) return Promise.resolve()
    return this._openPromise
  }

  async open(): Promise<boolean> {
    if (this._isOpen) {
      logger.warn(`Wallet ${this.id} is already open`)
      return true
    }

    try {
      await this._client.openClient(this._clientName)
      this._isOpen = true
      this._resolveOpen()
      logger.info(`Wallet ${this.id} opened successfully`)
      return true
    } catch (e) {
      logger.error(`Error opening wallet ${this.id}:`, e)
      return false
    }
  }

  async joinFederation(inviteCode: string) {
    if (this._isOpen) {
      throw new Error(
        `Wallet ${this.id} is already open. Cannot join federation on an open wallet.`,
      )
    }

    if (this._federationId) {
      throw new Error(
        `Wallet ${this.id} is already part of federation ${this._federationId}`,
      )
    }

    try {
      logger.info('called joinFederation with invite code:', inviteCode)
      const res = await this._client.joinFederation(
        inviteCode,
        this._clientName,
      )
      this._federationId = (
        await this._client.parseInviteCode(inviteCode)
      ).federation_id
      this._isOpen = true
      this._resolveOpen()

      logger.info(
        `Wallet ${this.id} successfully joined federation ${this._federationId}`,
      )
      if (res) {
        logger.info(
          `Federation ID for wallet ${this.id} is now ${this._federationId}`,
        )
      }
      return true
    } catch (e) {
      logger.error(`Error joining federation for wallet ${this.id}:`, e)
      this._isOpen = false
      this._federationId = undefined
      return false
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this._isOpen) {
        await this._client.closeClient(this._clientName)
      }
      WalletRegistry.getInstance().removeWallet(this.id)
      this._isOpen = false
      this._openPromise = undefined
      logger.info(`Wallet ${this.id} cleaned up`)
    } catch (error) {
      logger.error(`Error cleaning up wallet ${this.id}:`, error)
    }
  }

  isOpen(): boolean {
    return this._isOpen
  }

  // Debug/Testing methods
  _getActiveSubscriptionIds(): number[] {
    return this._client._getActiveSubscriptionIds()
  }

  _getActiveSubscriptionCount(): number {
    return this._client._getActiveSubscriptionCount()
  }

  _getRequestCounter(): number {
    return this._client._getRequestCounter()
  }
}
