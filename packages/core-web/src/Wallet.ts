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

// Create proxy service objects that provide appropriate behavior when in recovery mode
const createRecoveryModeProxy = (serviceName: string) => {
  return new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === 'then') {
          // Allow for Promise checks
          return undefined
        }

        return (..._args: any[]) => {
          const errorMsg = `Cannot use ${String(prop)} on ${serviceName} service while wallet is in recovery mode`
          logger.warn(errorMsg)
          if (typeof prop === 'string' && prop.startsWith('subscribe')) {
            // Return a no-op unsubscribe function for subscription methods
            return () => {}
          }
          return Promise.reject(new Error(errorMsg))
        }
      },
    },
  )
}

export class Wallet {
  public readonly id: string
  private _client: RpcClient
  private _clientName: string
  private _federationId: string
  private _isRecovering: boolean

  // Services
  public balance!: BalanceService
  public mint!: MintService
  public lightning!: LightningService
  public federation!: FederationService
  public recovery: RecoveryService
  public wallet!: WalletService

  constructor(
    client: RpcClient,
    federationId: string,
    walletId?: string,
    isRecovering = false,
  ) {
    this.id = walletId || generateUUID()
    this._client = client
    this._clientName = this.id
    this._federationId = federationId
    this._isRecovering = isRecovering

    // Recovery service is always available
    this.recovery = new RecoveryService(this._client, this._clientName)

    // Initialize other services based on recovery mode
    this.updateServices()

    if (!this._isRecovering) {
      logger.info(
        `Wallet ${this.id} opened for federation ${this._federationId}`,
      )
    } else {
      logger.info(
        `Wallet ${this.id} opened in recovery mode for federation ${this._federationId}`,
      )
    }
  }

  private async updateServices() {
    const recovering = await this.recovery.hasPendingRecoveries()
    await this.recovery.waitForAllRecoveries()
    this._isRecovering = recovering
    if (!this._isRecovering) {
      // Normal mode - initialize actual service instances
      this.balance = new BalanceService(this._client, this._clientName)
      this.mint = new MintService(this._client, this._clientName)
      this.lightning = new LightningService(this._client, this._clientName)
      this.federation = new FederationService(this._client, this._clientName)
      this.wallet = new WalletService(this._client, this._clientName)
    } else {
      // Recovery mode - use proxy objects that prevent usage
      this.balance = createRecoveryModeProxy(
        'balance',
      ) as unknown as BalanceService
      this.mint = createRecoveryModeProxy('mint') as unknown as MintService
      this.lightning = createRecoveryModeProxy(
        'lightning',
      ) as unknown as LightningService
      this.federation = createRecoveryModeProxy(
        'federation',
      ) as unknown as FederationService
      this.wallet = createRecoveryModeProxy(
        'wallet',
      ) as unknown as WalletService
    }
  }

  get federationId(): string {
    return this._federationId
  }

  get clientName(): string {
    return this._clientName
  }

  /**
   * Returns whether the wallet is in recovery mode.
   * When in recovery mode, only recovery-related functions are accessible.
   *
   * @returns {boolean} True if the wallet is in recovery mode, false otherwise.
   */
  get isRecovering(): boolean {
    return this._isRecovering
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
