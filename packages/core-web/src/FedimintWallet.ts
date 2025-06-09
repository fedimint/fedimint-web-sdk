import { RpcClient, TransportFactory } from './rpc'
import { createWebWorkerTransport } from './worker/WorkerTransport'
import { logger, type LogLevel } from './utils/logger'
import { Wallet } from './Wallet'
import { WalletRegistry } from './WalletRegistry'

logger.setLevel('debug')

export { Wallet }
export class FedimintWallet {
  private static instance: FedimintWallet
  private _client: RpcClient
  private _initialized: boolean = false
  private _initPromise?: Promise<void>

  private constructor(
    createTransport: TransportFactory = createWebWorkerTransport,
  ) {
    this._client = new RpcClient(createTransport)
    logger.info('FedimintWallet global instance created')
  }

  /**
   * Gets the singleton instance of FedimintWallet
   */
  static getInstance(createTransport?: TransportFactory): FedimintWallet {
    if (!FedimintWallet.instance) {
      FedimintWallet.instance = new FedimintWallet(createTransport)
    }
    return FedimintWallet.instance
  }

  /**
   * Initializes the global WASM and transport layer
   */
  async initialize(): Promise<void> {
    if (this._initialized) {
      return
    }

    if (this._initPromise) {
      return this._initPromise
    }

    this._initPromise = this._initializeInner()
    return this._initPromise
  }

  private async _initializeInner(): Promise<void> {
    logger.info('Initializing global RpcClient')
    await this._client.initialize()
    this._initialized = true
    logger.info('Global RpcClient initialized')
  }

  /**
   * Creates a new wallet instance
   */
  async createWallet(walletId?: string): Promise<Wallet> {
    // Ensure the global client is initialized
    await this.initialize()

    const wallet = new Wallet(this._client, walletId)
    logger.info(`Created new wallet with ID: ${wallet.id}`)
    return wallet
  }

  /**
   * Gets an existing wallet by ID
   */
  getWallet(walletId: string): Wallet | undefined {
    return WalletRegistry.getInstance().getWallet(walletId)
  }

  async openWallet(walletId: string): Promise<Wallet> {
    const wallet = new Wallet(this._client, walletId)
    return wallet
  }

  /**
   * Gets all wallets
   */
  getAllWallets(): Wallet[] {
    return WalletRegistry.getInstance().getAllWallets()
  }

  /**
   * Gets wallets by federation ID
   */
  getWalletsByFederation(federationId: string): Wallet[] {
    return WalletRegistry.getInstance().getWalletsByFederation(federationId)
  }

  /**
   *
   */
  async cleanup(): Promise<void> {
    await WalletRegistry.getInstance().cleanup()
    await this._client.cleanup()
    this._initialized = false
    this._initPromise = undefined
    logger.info('FedimintWallet global cleanup completed')
  }

  /**
   * Sets the log level for the library
   */
  setLogLevel(level: LogLevel): void {
    logger.setLevel(level)
    logger.info(`Global log level set to ${level}`)
  }

  isInitialized(): boolean {
    return this._initialized
  }
}

// Legacy support umm might be
// export { FedimintWallet as FedimintWalletLegacy }
