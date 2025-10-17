import { WalletDirector, type FedimintWallet } from '@fedimint/core'
import { RNTransport } from '@fedimint/transport-react-native'

let director: WalletDirector | null = null
let wallet: FedimintWallet | null = null

/**
 * Initialize the director
 * Call this on app startup to set up the transport
 */
export async function initializeWallet(): Promise<void> {
  // Return if already initialized
  if (director) {
    console.log('Director already initialized')
    return
  }
  console.log('Starting initialization...')

  try {
    const transport = new RNTransport()
    director = new WalletDirector(transport, true)

    await director.initialize()

    console.log('Director initialized and ready')
  } catch (error) {
    console.error('Failed to initialize:', error)
    throw error
  }
}

export function getDirector(): WalletDirector | null {
  return director
}

export async function createWallet(): Promise<FedimintWallet> {
  if (!director) {
    throw new Error('Director not initialized. Call initializeWallet() first.')
  }

  if (!wallet) {
    console.log('Creating new FedimintWallet instance...')
    wallet = await director.createWallet()
    console.log('✓ FedimintWallet created')
  } else {
    console.log('Returning existing wallet instance')
  }

  return wallet
}

export function getWallet(): FedimintWallet | null {
  return wallet
}
