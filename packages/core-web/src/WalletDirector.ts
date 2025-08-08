import { RpcClient, TransportFactory } from './rpc'
import { logger, type LogLevel } from './utils/logger'
import { generateUUID } from './utils/uuid'
import { Wallet } from './Wallet'
import type {
  ParsedInviteCode,
  PreviewFederation,
  ParsedBolt11Invoice,
  WalletInfo,
  WalletStorageData,
} from './types'

export class WalletDirector {
  // // Lazy singleton instance - not created until first access
  private static instance: WalletDirector | undefined

  // RPC Client
  private _client: RpcClient
  private _initialized: boolean = false
  private _initPromise?: Promise<void>

  // Wallet Management
  private wallets: Map<string, Wallet> = new Map()
  private readonly STORAGE_KEY = 'fedimint-wallets'
  private readonly STORAGE_VERSION = 1
  private readonly DEFAULT_STORAGE = {
    version: this.STORAGE_VERSION,
    wallets: [],
  } as const satisfies WalletStorageData

  private constructor() {
    // createTransport: TransportFactory = createWebWorkerTransport,
    this._client = new RpcClient()
    logger.info('WalletDirector global instance created')
  }

  static getInstance(): WalletDirector {
    if (!WalletDirector.instance) {
      WalletDirector.instance = new WalletDirector()
    }

    return WalletDirector.instance
  }

  /**
   * Initializes the WalletDirector instance.
   *
   * This method sets up the global RpcClient and prepares the wallet for use.
   * It should be called before creating or opening any wallets.
   *
   * @param {TransportFactory} [createTransport] - Optional factory function to create the transport.
   * @returns {Promise<void>} A promise that resolves when the initialization is complete.
   */
  async initialize(createTransport: TransportFactory): Promise<void> {
    if (this._initPromise) {
      return this._initPromise
    }

    if (!WalletDirector.instance) {
      WalletDirector.instance = new WalletDirector()
    }

    await this._client.initialize(createTransport)
    // this._initPromise = this._initializeInner()
    return this._initPromise
  }

  private async _initializeInner(): Promise<void> {
    logger.info('Initializing global RpcClient')

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

  async generateMnemonic() {
    if (!this._client) throw new Error('RpcClient is not initialized.')

    try {
      const res = await this._client.generateMnemonic()
      return res.mnemonic
    } catch (error) {
      logger.error('Error generating mnemonic:', error)
      throw error
    }
  }

  async setMnemonic(words: string[]) {
    try {
      const res = await this._client.setMnemonic(words)
      return res.success
    } catch (error) {
      logger.error('Error setting mnemonic:', error)
      throw error
    }
  }

  async getMnemonic() {
    try {
      const res = await this._client.getMnemonic()
      return res.mnemonic
    } catch (error) {
      logger.error('Error getting mnemonic:', error)
      throw error
    }
  }

  async joinFederation(inviteCode: string, walletId?: string): Promise<Wallet> {
    // TODO: Hash the walletId to remove this restriction
    if (walletId && walletId.length !== 36) {
      throw new Error('Wallet ID must be exactly 36 characters long')
    }

    // check if walletId exists in storage
    if (walletId && this.hasWallet(walletId)) {
      throw new Error(`Wallet with ID ${walletId} already exists`)
    }

    try {
      logger.debug('Joining federation with invite code:', inviteCode)

      // Parse the invite code to get federation ID
      const parsedInvite = await this._client.parseInviteCode(inviteCode)
      const federationId = parsedInvite.federation_id

      const clientName = walletId || generateUUID()

      await this._client.joinFederation(inviteCode, clientName)

      const wallet = new Wallet(this._client!, federationId, clientName)

      this.addWallet(wallet)
      logger.info(`Joined federation and created wallet with ID: ${wallet.id}`)
      return wallet
    } catch (error) {
      logger.error(`Error joining federation:`, error)
      throw error
    }
  }

  /**
   * Opens an existing wallet by its ID.
   *
   * @param {string} walletId - The ID of the wallet to open.
   * @returns {Promise<Wallet>} A promise that resolves to the opened Wallet instance.
   * @throws {Error} If the wallet with the specified ID does not exist.
   */
  async openWallet(walletId: string): Promise<Wallet> {
    // Check if wallet is already open in memory
    const existingWallet = this.getWallet(walletId)
    if (existingWallet) {
      logger.info(
        `Wallet ${walletId} is already open, returning existing instance`,
      )
      return existingWallet
    }

    const pointer = this.getWalletInfo(walletId)
    if (!pointer) {
      throw new Error(`Wallet ${walletId} not found`)
    }

    try {
      const clientName = walletId

      // Ensure the RPC client is initialized
      // await this._client.initialize()

      await this._client.openClient(clientName)

      const wallet = new Wallet(this._client!, pointer.federationId, walletId)

      this.addWallet(wallet)
      logger.info(
        `Wallet ${walletId} opened successfully with federation ${pointer.federationId}`,
      )
      return wallet
    } catch (error) {
      logger.error(`Error opening wallet ${walletId}:`, error)
      throw error
    }
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
    // All wallets in the registry are now considered active/open
    return Array.from(this.wallets.values())
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
    this._initialized = false
    this._initPromise = undefined
    logger.info('WalletDirector cleanup completed')
  }

  async nukeData(): Promise<void> {
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
    const data = await this._client.parseInviteCode(inviteCode)
    logger.info(`Parsed invite code: ${inviteCode}`, data)
    return data
  }

  async previewFederation(inviteCode: string): Promise<PreviewFederation> {
    const data = await this._client.previewFederation(inviteCode)
    logger.info(`Previewed federation for invite code: ${inviteCode}`, data)
    return data
  }

  async parseBolt11Invoice(invoice: string): Promise<ParsedBolt11Invoice> {
    const data = await this._client.parseBolt11Invoice(invoice)
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

      // TODO: Fix type safety. Remove this cast/implicit any.
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
    return this.DEFAULT_STORAGE
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

// Export Wallet director instance to use in index.ts
export function getDirector(): WalletDirector {
  const res = WalletDirector.getInstance()
  // res.initialize()
  return res
}
