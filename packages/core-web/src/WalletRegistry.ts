// filepath: /home/oms/Coding/opensource/fedimint-web-sdk/packages/core-web/src/WalletRegistry.ts
import { Wallet } from './Wallet'
import { logger } from './utils/logger'

export class WalletRegistry {
  private static instance: WalletRegistry
  private wallets: Map<string, Wallet> = new Map()

  private constructor() {}

  static getInstance(): WalletRegistry {
    if (!WalletRegistry.instance) {
      WalletRegistry.instance = new WalletRegistry()
    }
    return WalletRegistry.instance
  }

  addWallet(wallet: Wallet): void {
    this.wallets.set(wallet.id, wallet)
    logger.debug(`Wallet ${wallet.id} added to registry`)
  }

  removeWallet(walletId: string): void {
    const wallet = this.wallets.get(walletId)
    if (wallet) {
      this.wallets.delete(walletId)
      logger.debug(`Wallet ${walletId} removed from registry`)
    }
  }

  getWallet(walletId: string): Wallet | undefined {
    return this.wallets.get(walletId)
  }

  getAllWallets(): Wallet[] {
    return Array.from(this.wallets.values())
  }

  getWalletsByFederation(federationId: string): Wallet[] {
    return Array.from(this.wallets.values()).filter(
      (wallet) => wallet.federationId === federationId,
    )
  }

  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.wallets.values()).map((wallet) =>
      wallet.cleanup(),
    )
    await Promise.all(cleanupPromises)
    this.wallets.clear()
  }
}
