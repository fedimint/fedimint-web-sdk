import { Wallet } from './Wallet'
import { logger } from './utils/logger'

interface WalletInfo {
  id: string
  clientName: string
  federationId?: string
  createdAt: number
  lastAccessedAt: number
}

interface WalletStorageData {
  version: number
  wallets: WalletInfo[]
}

export class WalletManager {
  private static instance: WalletManager
  private wallets: Map<string, Wallet> = new Map()
  private readonly STORAGE_KEY = 'fedimint-wallets'
  private readonly STORAGE_VERSION = 1

  private constructor() {
    this.loadWalletsFromStorage()
  }

  static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager()
    }
    return WalletManager.instance
  }

  addWallet(wallet: Wallet): void {
    this.wallets.set(wallet.id, wallet)
    this.saveWalletInfo(wallet)
    logger.debug(`Wallet ${wallet.id} added to registry`)
  }

  removeWallet(walletId: string): void {
    const wallet = this.wallets.get(walletId)
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

  // Get all active wallets
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

  // If needed
  updateWalletFederation(walletId: string, federationId: string): void {
    try {
      const data = this.getStorageData()
      const walletIndex = data.wallets.findIndex((w) => w.id === walletId)

      if (walletIndex !== -1) {
        data.wallets[walletIndex].federationId = federationId
        data.wallets[walletIndex].lastAccessedAt = Date.now()
        this.saveStorageData(data)

        const wallet = this.wallets.get(walletId)
        if (wallet) {
          wallet['_federationId'] = federationId
        }

        logger.debug(
          `Updated federation ID for wallet ${walletId} to ${federationId}`,
        )
      }
    } catch (error) {
      logger.error(`Error updating wallet federation for ${walletId}:`, error)
    }
  }

  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.wallets.values()).map((wallet) =>
      wallet.cleanup(),
    )
    await Promise.all(cleanupPromises)
    this.wallets.clear()
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

  private loadWalletsFromStorage(): void {
    try {
      const data = this.getStorageData()
      logger.debug(`Loaded ${data.wallets.length} wallet pointers from storage`)
    } catch (error) {
      logger.error('Error loading wallets from storage:', error)
      this.initializeStorage()
    }
  }

  private saveWalletInfo(wallet: Wallet): void {
    try {
      const data = this.getStorageData()
      const existingIndex = data.wallets.findIndex((w) => w.id === wallet.id)

      const pointer: WalletInfo = {
        id: wallet.id,
        clientName: wallet.clientName,
        federationId: wallet.federationId,
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

      // Check1...
      if ((error as { name: string }).name === 'QuotaExceededError') {
        this.handleStorageQuotaExceeded(data)
      }
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

  private handleStorageQuotaExceeded(data: WalletStorageData): void {
    logger.warn('Storage quota exceeded, attempting cleanup')

    if (data.wallets.length > 50) {
      data.wallets.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
      data.wallets = data.wallets.slice(0, 50)

      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
        logger.info('Cleaned up old wallets due to storage quota')
      } catch (error) {
        logger.error('Failed to save after cleanup:', error)
      }
    }
  }

  private async checkIndexedDBExists(clientName: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(clientName)
        request.onsuccess = () => {
          request.result.close()
          resolve(true)
        }
        request.onerror = () => resolve(false)
        request.onupgradeneeded = () => {
          request.result.close()
          resolve(false)
        }
      } catch (error) {
        resolve(false)
      }
    })
  }
}
