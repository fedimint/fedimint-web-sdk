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
import { WalletManager } from './WalletManager'

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

  constructor(client: RpcClient, walletId?: string, federationId?: string) {
    this.id = walletId || generateUUID()
    this._client = client
    this._clientName = `wallet-${this.id}`
    this._federationId = federationId // Set federation ID if provided

    this._openPromise = new Promise((resolve) => {
      this._resolveOpen = resolve
    })

    // nit: are both the client and clientName needed
    this.balance = new BalanceService(this._client, this._clientName)
    this.mint = new MintService(this._client, this._clientName)
    this.lightning = new LightningService(this._client, this._clientName)
    this.federation = new FederationService(this._client, this._clientName)
    this.recovery = new RecoveryService(this._client, this._clientName)
    this.wallet = new WalletService(this._client, this._clientName)

    // Register wallet
    WalletManager.getInstance().addWallet(this)

    logger.info(
      `Wallet ${this.id} instantiated${federationId ? ` with federation ${federationId}` : ''}`,
    )
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
      throw new Error('The FedimintWallet is already open.')
    }

    try {
      // Ensure the RPC client is initialized before making the call
      await this._client.initialize()
      await this._client.openClient(this._clientName)
      this._isOpen = true
      this._resolveOpen()
      logger.info(
        `Wallet ${this.id} opened successfully${this._federationId ? ` with federation ${this._federationId}` : ''}`,
      )
      return true
    } catch (e) {
      logger.error(`Error opening wallet ${this.id}:`, e)
      return false
    }
  }

  /**
   * Joins a federation using the provided invite code.
   * @param inviteCode The invite code for the federation.
   * @returns A promise that resolves to true if the wallet successfully joined the federation, false otherwise.
   */
  async joinFederation(inviteCode: string) {
    if (this._isOpen) {
      throw new Error(
        'The FedimintWallet is already open. You can only call `joinFederation` on closed clients.',
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

      // Update the registry with the new federation ID
      WalletManager.getInstance().updateWalletFederation(
        this.id,
        this._federationId,
      )

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
      if (this._isOpen) {
        await this._client.closeClient(this._clientName)
      }
      WalletManager.getInstance().removeWallet(this.id)
      this._isOpen = false
      this._openPromise = undefined
      logger.info(`Wallet ${this.id} cleaned up`)
    } catch (error) {
      logger.error(`Error cleaning up wallet ${this.id}:`, error)
    }
  }

  /**
   * Checks if the wallet is currently open.
   * @returns {boolean} True if the wallet is open, false otherwise.
   */
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
