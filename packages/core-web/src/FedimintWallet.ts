import { RpcClient, TransportFactory } from './rpc'
import { createWebWorkerTransport } from './worker/WorkerTransport'
import { logger, type LogLevel } from './utils/logger'
import { Wallet } from './Wallet'
import { WalletManager } from './WalletManager'
import type {
  ParsedInviteCode,
  PreviewFederation,
  ParsedBolt11Invoice,
} from './types'

logger.setLevel('debug')

export { Wallet }
export class FedimintWallet {
  // Manager
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
   * Retrieves the singleton instance of FedimintWallet.
   *
   * This method ensures that only one instance of FedimintWallet is created
   * throughout the application. If an instance already exists, it returns that
   * instance; otherwise, it creates a new one using the provided transport factory.
   *
   * @param {TransportFactory} [createTransport] - Optional factory function to create the transport.
   * @returns {FedimintWallet} The singleton instance of FedimintWallet.
   */
  static getInstance(createTransport?: TransportFactory): FedimintWallet {
    if (!FedimintWallet.instance) {
      FedimintWallet.instance = new FedimintWallet(createTransport)
    }
    return FedimintWallet.instance
  }

  /**
   * Initializes the FedimintWallet instance.
   *
   * This method sets up the global RpcClient and prepares the wallet for use.
   * It should be called before creating or opening any wallets.
   *
   * @returns {Promise<void>} A promise that resolves when the initialization is complete.
   */
  // nit: should this be called initializeGlobalClient?
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
   * Creates a new wallet instance.
   *
   * This method initializes the FedimintWallet if it hasn't been initialized yet,
   * and then creates a new Wallet instance with a unique ID. If a walletId is
   * provided, it will use that ID; otherwise, it generates a new one.
   *
   * @param {string} [walletId] - Optional ID for the new wallet. If not provided,
   *                              a new ID will be generated.
   * @returns {Promise<Wallet>} A promise that resolves to the newly created Wallet instance.
   */
  async createWallet(walletId?: string): Promise<Wallet> {
    await this.initialize()

    const wallet = new Wallet(this._client, walletId)
    logger.info(`Created new wallet with ID: ${wallet.id}`)
    return wallet
  }

  /**
   * Opens an existing wallet by its ID.
   *
   * This method checks if the wallet with the specified ID exists in the
   * WalletManager. If it does, it creates a new Wallet instance and opens it.
   * If the wallet does not exist, it throws an error.
   *
   * @param {string} walletId - The ID of the wallet to open.
   * @returns {Promise<Wallet>} A promise that resolves to the opened Wallet instance.
   * @throws {Error} If the wallet with the specified ID does not exist.
   */
  async openWallet(walletId: string): Promise<Wallet> {
    await this.initialize()
    logger.info(`called initialize for openWallet`)

    // Check if wallet exists in storage
    const pointer = WalletManager.getInstance().getWalletInfo(walletId)
    if (!pointer) {
      throw new Error(`Wallet ${walletId} not found`)
    }

    let wallet = new Wallet(this._client, walletId, pointer.federationId)
    await wallet.open()
    return wallet
  }

  /**
   * Retrieves a wallet by its ID.
   *
   * This method checks if the wallet with the specified ID exists and returns
   * the corresponding Wallet instance if found. If the wallet does not exist,
   * it returns undefined.
   *
   * @param {string} walletId - The ID of the wallet to retrieve.
   * @returns {Wallet | undefined} The Wallet instance if found, otherwise undefined.
   */
  getWallet(walletId: string): Wallet | undefined {
    return WalletManager.getInstance().getWallet(walletId)
  }

  /**
   * Lists all clients managed by the WalletManager.
   *
   * This method retrieves an array of objects representing the clients, each
   * containing the client's ID, name, federation ID (if applicable), creation
   * timestamp, and last accessed timestamp.
   *
   * @returns {Array<{ id: string, clientName: string, federationId?: string, createdAt: number, lastAccessedAt: number }>}
   *          An array of client objects.
   */
  listClients(): Array<{
    id: string
    clientName: string
    federationId?: string
    createdAt: number
    lastAccessedAt: number
  }> {
    return WalletManager.getInstance().listClients()
  }

  /**
   * Checks if a wallet with the given ID exists in the WalletManager.
   *
   * This method verifies whether a wallet with the specified ID is managed by
   * the WalletManager. It returns true if the wallet exists, false otherwise.
   *
   * @param {string} walletId - The ID of the wallet to check.
   * @returns {boolean} True if the wallet exists, false otherwise.
   */
  hasWallet(walletId: string): boolean {
    return WalletManager.getInstance().hasWallet(walletId)
  }

  /**
   * Retrieves all wallets managed by the WalletManager.
   *
   * This method returns an array of all Wallet instances are open and initialized.
   *
   * @returns {Wallet[]} An array of Wallet instances.
   */
  getActiveWallets(): Wallet[] {
    return WalletManager.getInstance().getActiveWallets()
  }

  /**
   * Retrieves all wallets associated with a specific federation.
   *
   * This method returns an array of Wallet instances that belong to the
   * specified federation ID. It is useful for managing and accessing wallets
   * within a particular federation context.
   * Note: Only wallets that are open and initialized will be returned.
   *
   * @param {string} federationId - The ID of the federation to filter wallets by.
   * @returns {Wallet[]} An array of Wallet instances associated with the given federation ID.
   */
  getWalletsByFederation(federationId: string): Wallet[] {
    return WalletManager.getInstance().getWalletsByFederation(federationId)
  }

  /**
   * Cleans up the FedimintWallet instance.
   *
   * This method performs necessary cleanup operations, such as closing the
   * RpcClient and resetting the initialized state. It should be called when
   * the application is shutting down or when the wallet is no longer needed.
   *
   * @returns {Promise<void>} A promise that resolves when the cleanup is complete.
   */
  async cleanup(): Promise<void> {
    await WalletManager.getInstance().cleanup()
    await this._client.cleanup()
    this._initialized = false
    this._initPromise = undefined
    logger.info('FedimintWallet global cleanup completed')
  }

  /**
   * Clears all wallets from the WalletManager.
   *
   * This method removes all wallets from the WalletManager, effectively resetting
   * the wallet state. It is useful for scenarios where you want to start fresh
   * without any existing wallets.
   * Note: This does not delete any wallet data from storage.
   *
   * @returns {Promise<void>} A promise that resolves when all wallets have been cleared.
   */
  async clearAllWallets(): Promise<void> {
    await WalletManager.getInstance().clearAllWallets()
  }

  /**
   * Sets the global log level for the FedimintWallet.
   *
   * This method allows you to change the log level for all logging operations
   * within the FedimintWallet. The available log levels are 'debug', 'info',
   * 'warn', 'error', and 'silent'.
   *
   * @param {LogLevel} level - The desired log level to set.
   */
  setLogLevel(level: LogLevel): void {
    logger.setLevel(level)
    logger.info(`Global log level set to ${level}`)
  }

  /**
   * Checks if the FedimintWallet has been initialized.
   *
   * This method returns a boolean indicating whether the wallet has been
   * initialized and is ready for use.
   *
   * @returns {boolean} True if the wallet is initialized, false otherwise.
   */
  isInitialized(): boolean {
    return this._initialized
  }

  /**
   * Parses a federation invite code and retrieves its details.
   *
   * This method sends the provided invite code to the WorkerClient for parsing.
   * The response includes the federation_id and url.
   *
   * @param {string} inviteCode - The invite code to be parsed.
   * @returns {Promise<{ federation_id: string, url: string}>}
   *          A promise that resolves to an object containing:
   *          - `federation_id`: The id of the feder.
   *          - `url`: One of the apipoints to connect to the federation
   *
   * @throws {Error} If the WorkerClient encounters an issue during the parsing process.
   *
   * @example
   * const inviteCode = "example-invite-code";
   * const parsedCode = await wallet.parseInviteCode(inviteCode);
   * console.log(parsedCode.federation_id, parsedCode.url);
   */
  async parseInviteCode(inviteCode: string): Promise<ParsedInviteCode> {
    const data = await this._client.parseInviteCode(inviteCode)
    logger.info(`Parsed invite code: ${inviteCode}`, data)
    return data
  }

  /**
   * Previews a federation based on the provided invite code.
   *
   * This method sends the invite code to the WorkerClient to retrieve
   * a preview of the federation details.
   *
   * @param {string} inviteCode - The invite code for the federation.
   * @returns {Promise<PreviewFederation>} A promise that resolves to an object containing:
   *          - `config`: The federation configuration.
   *         - `federation_id`: The id of the federation.
   *
   * @throws {Error} If the WorkerClient encounters an issue during the preview process.
   *
   * @example
   * const inviteCode = "fed11qgqrgv.....";
   * const preview = await wallet.previewFederation(inviteCode);
   * console.log(preview.federation_id, preview.config);
   */
  async previewFederation(inviteCode: string): Promise<PreviewFederation> {
    const data = await this._client.previewFederation(inviteCode)
    logger.info(`Previewed federation for invite code: ${inviteCode}`, data)
    return data
  }

  /**
   * Parses a BOLT11 Lightning invoice and retrieves its details.
   *
   * This method sends the provided invoice string to the WorkerClient for parsing.
   * The response includes details such as the amount, expiry, and memo.
   *
   * @param {string} invoiceStr - The BOLT11 invoice string to be parsed.
   * @returns {Promise<{ amount: string, expiry: number, memo: string }>}
   *          A promise that resolves to an object containing:
   *          - `amount`: The amount specified in the invoice.
   *          - `expiry`: The expiry time of the invoice in seconds.
   *          - `memo`: A description or memo attached to the invoice.
   *
   * @throws {Error} If the WorkerClient encounters an issue during the parsing process.
   *
   * @example
   * const invoiceStr = "lnbc1...";
   * const parsedInvoice = await wallet.parseBolt11Invoice(invoiceStr);
   * console.log(parsedInvoice.amount, parsedInvoice.expiry, parsedInvoice.memo);
   */
  async parseBolt11Invoice(invoice: string): Promise<ParsedBolt11Invoice> {
    const data = await this._client.parseBolt11Invoice(invoice)
    logger.info(`Parsed Bolt11 invoice: ${invoice}`, data)
    return data
  }
}

// Legacy support umm might be
// export { FedimintWallet as FedimintWalletLegacy }
