import { RpcClient, TransportFactory } from './rpc'
import { createWebWorkerTransport } from './worker/WorkerTransport'
import { logger, type LogLevel } from './utils/logger'
import { Wallet } from './Wallet'
import { WalletRegistry } from './WalletRegistry'
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

  static getInstance(createTransport?: TransportFactory): FedimintWallet {
    if (!FedimintWallet.instance) {
      FedimintWallet.instance = new FedimintWallet(createTransport)
    }
    return FedimintWallet.instance
  }

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

  async createWallet(walletId?: string): Promise<Wallet> {
    await this.initialize()

    const wallet = new Wallet(this._client, walletId)
    logger.info(`Created new wallet with ID: ${wallet.id}`)
    return wallet
  }

  async openWallet(walletId: string): Promise<Wallet> {
    await this.initialize()
    logger.info(`called initialize for openWallet`)

    // Check if wallet exists in storage
    const pointer = WalletRegistry.getInstance().getWalletPointer(walletId)
    if (!pointer) {
      throw new Error(`Wallet ${walletId} not found`)
    }

    let wallet = new Wallet(this._client, walletId, pointer.federationId)
    await wallet.open()
    return wallet
  }

  getWallet(walletId: string): Wallet | undefined {
    return WalletRegistry.getInstance().getWallet(walletId)
  }

  getAllWalletPointers(): Array<{
    id: string
    clientName: string
    federationId?: string
    createdAt: number
    lastAccessedAt: number
  }> {
    return WalletRegistry.getInstance().getAllWalletPointers()
  }

  hasWallet(walletId: string): boolean {
    return WalletRegistry.getInstance().hasWallet(walletId)
  }

  getAllWallets(): Wallet[] {
    return WalletRegistry.getInstance().getAllWallets()
  }

  getWalletsByFederation(federationId: string): Wallet[] {
    return WalletRegistry.getInstance().getWalletsByFederation(federationId)
  }

  async cleanup(): Promise<void> {
    await WalletRegistry.getInstance().cleanup()
    await this._client.cleanup()
    this._initialized = false
    this._initPromise = undefined
    logger.info('FedimintWallet global cleanup completed')
  }

  async clearAllWallets(): Promise<void> {
    await WalletRegistry.getInstance().clearAllWallets()
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
}

// Legacy support umm might be
// export { FedimintWallet as FedimintWalletLegacy }
