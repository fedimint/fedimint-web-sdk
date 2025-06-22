import { RpcClient, TransportFactory } from './rpc'
import { createWebWorkerTransport } from './worker/WorkerTransport'
import { logger, type LogLevel } from './utils/logger'
import { Wallet } from './Wallet'
import type {
  ParsedInviteCode,
  PreviewFederation,
  ParsedBolt11Invoice,
} from './types'

interface WalletInfo {
  id: string
  clientName: string
  federationId: string
  createdAt: number
  lastAccessedAt: number
}

interface WalletStorageData {
  version: number
  wallets: WalletInfo[]
}

logger.setLevel('debug')

class WalletDirector {
  // Lazy singleton instance - not created until first access
  private static instance: WalletDirector | undefined

  // RPC Client
  private _client: RpcClient | undefined
  private _initialized: boolean = false
  private _initPromise?: Promise<void>

  // Wallet Management
  private wallets: Map<string, Wallet> = new Map()
  private _storageLoaded: boolean = false
  private readonly STORAGE_KEY = 'fedimint-wallets'
  private readonly STORAGE_VERSION = 1

  private constructor(
    createTransport: TransportFactory = createWebWorkerTransport,
  ) {
    this._client = new RpcClient(createTransport)
    logger.info('WalletDirector global instance created')
  }

  static getInstance(createTransport?: TransportFactory): WalletDirector {
    if (!WalletDirector.instance) {
      WalletDirector.instance = new WalletDirector(createTransport)
    }

    return WalletDirector.instance
  }

  /**
   * Initializes the WalletDirector instance with lazy loading.
   *
   * This method sets up the global RpcClient and prepares the wallet for use.
   * It should be called before creating or opening any wallets.
   *
   * @param {TransportFactory} [createTransport] - Optional factory function to create the transport.
   * @returns {Promise<void>} A promise that resolves when the initialization is complete.
   */
  async initialize(createTransport?: TransportFactory): Promise<void> {
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
    if (!this._client) {
      throw new Error('RpcClient is not initialized')
    }
    await this._client.initialize()

    // Initialize storage if it doesn't exist
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) {
        this.initializeStorage()
        logger.debug('Storage initialized with default structure')
      }
    } catch (error) {
      logger.error('Error checking storage initialization:', error)
    }

    this._initialized = true
    logger.info('Global RpcClient initialized')
  }

  async joinFederation(inviteCode: string, walletId?: string): Promise<Wallet> {
    await this.initialize()
    // check if walletid exists Initializein storage
    if (walletId && this.hasWallet(walletId)) {
      throw new Error(`Wallet with ID ${walletId} already exists`)
    }
    const wallet = new Wallet(this._client!, walletId)
    const res = await wallet.joinFederation(inviteCode)
    if (res) {
      this.addWallet(wallet)
    }
    logger.info(`Joined federation and created wallet with ID: ${wallet.id}`)
    return wallet
  }

  /**
   * Opens an existing wallet by its ID.
   *
   * @param {string} walletId - The ID of the wallet to open.
   * @returns {Promise<Wallet>} A promise that resolves to the opened Wallet instance.
   * @throws {Error} If the wallet with the specified ID does not exist.
   */
  async openWallet(walletId: string): Promise<Wallet> {
    await this.initialize()
    const pointer = this.getWalletInfo(walletId)
    if (!pointer) {
      throw new Error(`Wallet ${walletId} not found`)
    }
    const fed = pointer.federationId
    let wallet = new Wallet(this._client!, walletId)
    const walletOpen = await wallet.open(pointer.federationId)
    if (walletOpen) {
      this.addWallet(wallet)
    }
    return wallet
  }

  private addWallet(wallet: Wallet): void {
    this.wallets.set(wallet.id, wallet)
    this.saveWalletInfo(wallet)
    logger.debug(`Wallet ${wallet.id} added to registry`)
  }

  removeWallet(walletId: string): void {
    const wallet = this.wallets.get(walletId)
    wallet?.cleanup()
    if (wallet) {
      this.wallets.delete(walletId)
      this.removeWalletInfo(walletId)
      logger.debug(`Wallet ${walletId} removed from registry`)
    }
  }

  getWallet(walletId: string): Wallet | undefined {
    const wallet = this.wallets.get(walletId)
    if (wallet) {
      this.updateLastAccessed(walletId)
    }
    return wallet
  }

  getActiveWallets(): Wallet[] {
    return Array.from(this.wallets.values()).filter((wallet) => wallet.isOpen())
  }

  getWalletsByFederation(federationId: string): Wallet[] {
    return Array.from(this.wallets.values()).filter(
      (wallet) => wallet.federationId === federationId,
    )
  }

  listClients(): WalletInfo[] {
    try {
      const data = this.getStorageData()
      return data.wallets.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
    } catch (error) {
      logger.error('Error getting wallet pointers:', error)
      return []
    }
  }

  getWalletInfo(walletId: string): WalletInfo | undefined {
    const pointers = this.listClients()
    return pointers.find((pointer) => pointer.id === walletId)
  }

  hasWallet(walletId: string): boolean {
    return this.getWalletInfo(walletId) !== undefined
  }

  getClientName(walletId: string): string | undefined {
    const pointer = this.getWalletInfo(walletId)
    return pointer?.clientName
  }

  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.wallets.values()).map((wallet) =>
      wallet.cleanup(),
    )
    await Promise.all(cleanupPromises)
    this.wallets.clear()

    if (this._client) {
      await this._client.cleanup()
    }
    this._client = undefined
    this._initialized = false
    this._initPromise = undefined
    this._storageLoaded = false
    logger.info('WalletDirector cleanup completed')
  }

  async clearAllWallets(): Promise<void> {
    await this.cleanup()
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      logger.info('All wallet data cleared')
    } catch (error) {
      logger.error('Error clearing wallet storage:', error)
    }
  }

  setLogLevel(level: LogLevel): void {
    logger.setLevel(level)
    logger.info(`Global log level set to ${level}`)
  }

  isInitialized(): boolean {
    return this._initialized
  }

  async parseInviteCode(inviteCode: string): Promise<ParsedInviteCode> {
    await this.initialize()

    const data = await this._client!.parseInviteCode(inviteCode)
    logger.info(`Parsed invite code: ${inviteCode}`, data)
    return data
  }

  async previewFederation(inviteCode: string): Promise<PreviewFederation> {
    await this.initialize()

    const data = await this._client!.previewFederation(inviteCode)
    logger.info(`Previewed federation for invite code: ${inviteCode}`, data)
    return data
  }

  async parseBolt11Invoice(invoice: string): Promise<ParsedBolt11Invoice> {
    await this.initialize()

    const data = await this._client!.parseBolt11Invoice(invoice)
    logger.info(`Parsed Bolt11 invoice: ${invoice}`, data)
    return data
  }

  private saveWalletInfo(wallet: Wallet): void {
    try {
      const data = this.getStorageData()
      const existingIndex = data.wallets.findIndex((w) => w.id === wallet.id)

      const pointer: WalletInfo = {
        id: wallet.id,
        clientName: wallet.clientName,
        federationId: wallet.federationId ?? '',
        createdAt:
          existingIndex === -1
            ? Date.now()
            : data.wallets[existingIndex].createdAt,
        lastAccessedAt: Date.now(),
      }

      if (existingIndex === -1) {
        data.wallets.push(pointer)
      } else {
        data.wallets[existingIndex] = pointer
      }

      this.saveStorageData(data)
      logger.debug(
        `Saved wallet pointer for ${wallet.id} with federation ${wallet.federationId || 'none'}`,
      )
    } catch (error) {
      logger.error(`Error saving wallet pointer for ${wallet.id}:`, error)
    }
  }

  private removeWalletInfo(walletId: string): void {
    try {
      const data = this.getStorageData()
      data.wallets = data.wallets.filter((w) => w.id !== walletId)
      this.saveStorageData(data)
    } catch (error) {
      logger.error(`Error removing wallet pointer for ${walletId}:`, error)
    }
  }

  private updateLastAccessed(walletId: string): void {
    try {
      const data = this.getStorageData()
      const wallet = data.wallets.find((w) => w.id === walletId)
      if (wallet) {
        wallet.lastAccessedAt = Date.now()
        this.saveStorageData(data)
      }
    } catch (error) {
      logger.error(`Error updating last accessed for ${walletId}:`, error)
    }
  }

  private getStorageData(): WalletStorageData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) {
        return this.getDefaultStorageData()
      }

      const parsed: WalletStorageData = JSON.parse(stored)
      return parsed
    } catch (error) {
      logger.error('Error parsing wallet storage data:', error)
      return this.getDefaultStorageData()
    }
  }

  private saveStorageData(data: WalletStorageData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      logger.error('Error saving wallet storage data:', error)
    }
  }

  private getDefaultStorageData(): WalletStorageData {
    return {
      version: this.STORAGE_VERSION,
      wallets: [],
    }
  }

  private initializeStorage(): void {
    try {
      this.saveStorageData(this.getDefaultStorageData())
      logger.debug('Initialized wallet storage')
    } catch (error) {
      logger.error('Error initializing wallet storage:', error)
    }
  }
}

// export WalletDirector for testing
export function getDirector(): WalletDirector {
  const res = WalletDirector.getInstance()
  res.initialize()
  return res
}

// Export individual functions

const initialize = (createTransport?: TransportFactory) =>
  getDirector().initialize(createTransport)

/**
 * Creates a new wallet and joins a federation using the provided invite code.
 *
 * If a wallet ID is provided, it will be used to identify the wallet.
 * If the wallet ID already exists, it throws an error.
 *
 * @param {string} inviteCode - The invite code to join the federation.
 * @param {string} [walletId] - Optional wallet ID to identify the wallet.
 * @returns {Promise<Wallet>} A promise that resolves to the created Wallet instance.
 * @throws {Error} If the wallet ID already exists in the storage.
 */
const joinFederation = (
  inviteCode: string,
  walletId?: string,
): Promise<Wallet> => getDirector().joinFederation(inviteCode, walletId)

/**
 * Opens an existing wallet by its ID.
 *
 * Opens the wallet with the specified ID. If the wallet is not found,
 * it throws an error.
 *
 * @param {string} walletId - The ID of the wallet to open.
 * @returns {Promise<Wallet>} A promise that resolves to the opened Wallet instance.
 */
const openWallet = (walletId: string): Promise<Wallet> =>
  getDirector().openWallet(walletId)

/** Removes a wallet by its ID.
 * This method removes the wallet from the WalletDirector's registry
 * and cleans up any associated resources.
 * @param {string} walletId - The ID of the wallet to remove.
 * @returns {void}
 */
const removeWallet = (walletId: string): void =>
  getDirector().removeWallet(walletId)

/**
 * Retrieves a wallet by its ID.
 *
 * This method returns the Wallet instance associated with the specified ID.
 * If the wallet is not found, it returns undefined.
 *
 * @param {string} walletId - The ID of the wallet to retrieve.
 * @returns {Wallet | undefined} The Wallet instance or undefined if not found.
 */
const getWallet = (walletId: string): Wallet | undefined =>
  getDirector().getWallet(walletId)

/**
 * Retrieves all active wallets.
 *
 * This method returns an array of all wallets that are currently open
 * in the memory.
 *
 * @returns {Wallet[]} An array of active Wallet instances.
 */
const getActiveWallets = (): Wallet[] => getDirector().getActiveWallets()

/**
 * Retrieves all wallets associated with a specific federation.
 *
 * This method returns an array of Wallet instances that belong to the
 * specified federation ID.
 * note: This method does not check if the wallets are open or closed.
 *
 * @param {string} federationId - The ID of the federation to filter wallets by.
 * @returns {Wallet[]} An array of Wallet instances associated with the federation.
 */
const getWalletsByFederation = (federationId: string): Wallet[] =>
  getDirector().getWalletsByFederation(federationId)

/**
 * Lists all clients (with complete meta) managed by the WalletDirector.
 *
 * This method retrieves all wallet info stored in the internal
 * storage.
 * @returns {WalletInfo[]} An array of wallet info objects, each containing
 *                         the wallet ID, client name, federation ID (if any),
 *                         creation time, and last accessed time.
 */
const listClients = (): WalletInfo[] => getDirector().listClients()

/**
 * Retrieves information about a specific wallet.
 * This method returns an object containing the wallet's ID, client name,
 * federation ID (if any), creation time, and last accessed time.
 * @param {string} walletId - The ID of the wallet to retrieve information for.
 * @returns {WalletInfo | undefined} An object containing wallet information,
 *                                  or undefined if the wallet does not exist.
 */
const getWalletInfo = (walletId: string): WalletInfo | undefined =>
  getDirector().getWalletInfo(walletId)

/**
 * Checks if a wallet with the specified ID exists.
 * This method returns true if the wallet exists, false otherwise.
 * @param {string} walletId - The ID of the wallet to check.
 * @returns {boolean} True if the wallet exists, false otherwise.
 */
const hasWallet = (walletId: string): boolean =>
  getDirector().hasWallet(walletId)

/**
 * Retrieves the client name associated with a specific wallet ID.
 *
 * This method returns the client name for the specified wallet ID.
 * If the wallet does not exist, it returns undefined.
 *
 * @param {string} walletId - The ID of the wallet to retrieve the client name for.
 * @returns {string | undefined} The client name or undefined if the wallet does not exist.
 */
const getClientName = (walletId: string): string | undefined =>
  getDirector().getClientName(walletId)

/**
 * Cleans up the WalletDirector instance.
 * This method cleans up all wallets, clears the RPC client, and resets the
 * internal state of the WalletDirector.
 * @returns {Promise<void>} A promise that resolves when the cleanup is complete.
 */
const cleanup = (): Promise<void> => getDirector().cleanup()

/**
 * Clears all wallets and their associated data.
 * This method removes all wallets from the WalletDirector's registry,
 * cleans up their resources, and clears the local storage where wallet data is stored.
 * @returns {Promise<void>} A promise that resolves when all wallets are cleared.
 */
const clearAllWallets = (): Promise<void> => getDirector().clearAllWallets()

/**
 * Sets the global log level.
 * @param {LogLevel} level - The log level to set. Can be 'debug', 'info', 'warn', 'error'.
 */
const setLogLevel = (level: LogLevel) => getDirector().setLogLevel(level)

/**
 * Checks if the WalletDirector is initialized.
 * @returns {boolean} True if initialized, false otherwise.
 */
const isInitialized = (): boolean => getDirector().isInitialized()

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
const parseInviteCode = (
  inviteCode: string,
): Promise<{ federation_id: string; url: string }> =>
  getDirector().parseInviteCode(inviteCode)

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
const previewFederation = (inviteCode: string): Promise<PreviewFederation> =>
  getDirector().previewFederation(inviteCode)

/**
 * Parses a BOLT11 Lightning invoice and retrieves its details.
 *
 * This method sends the provided invoice string to the WorkerClient for parsing.
 * The response includes details such as the amount, expiry, and memo.
 *
 * @param {string} invoice - The BOLT11 invoice string to be parsed.
 * @returns {Promise<ParsedBolt11Invoice>}
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
const parseBolt11Invoice = (invoice: string): Promise<ParsedBolt11Invoice> =>
  getDirector().parseBolt11Invoice(invoice)

// Export all functions and the class
export {
  // Core wallet functions
  initialize,
  joinFederation,
  openWallet,
  removeWallet,
  getWallet,
  getActiveWallets,
  getWalletsByFederation,

  // Wallet management functions
  listClients,
  getWalletInfo,
  hasWallet,
  getClientName,

  // Utility functions
  cleanup,
  clearAllWallets,
  setLogLevel,
  isInitialized,

  // Parse functions
  parseInviteCode,
  previewFederation,
  parseBolt11Invoice,

  // Classes
  Wallet,
  WalletDirector,
}
