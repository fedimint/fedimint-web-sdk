import { getDirector, initializeDirector } from './WalletDirector'
import { Wallet } from './Wallet'
import {
  WalletInfo,
  ParsedBolt11Invoice,
  ParsedInviteCode,
  PreviewFederation,
} from './types'
import { type LogLevel } from './utils/logger'
import {
  createTauriTransport,
  createWebWorkerTransport,
  type TransportFactory,
} from './transport'
/**
 * Initializes the WalletDirector instance.
 *
 * This method sets up the global RpcClient and prepares the wallet for use.
 *

 * @param {TransportFactory} [createTransport] - Factory function to create the transport.
 * @returns {Promise<void>} A promise that resolves when the initialization is complete.
 */
const initialize = (createTransport: TransportFactory): Promise<void> =>
  initializeDirector(createTransport)

/**
 * Creates a new wallet and joins a federation using the provided invite code.
 *
 * If a wallet ID is provided, it will be used to identify the wallet.
 * If the wallet ID already exists, it throws an error.
 *
 * @param {string} inviteCode - The invite code to join the federation.
 * @param {boolean} [recover] - Optional flag to indicate if this is a recovery operation.
 * @param {string} [walletId] - Optional wallet ID to identify the wallet. Must be exactly 36 characters long.
 * @returns {Promise<Wallet>} A promise that resolves to the created Wallet instance.
 * @throws {Error} If the wallet ID already exists in the storage.
 */
const joinFederation = (
  inviteCode: string,
  recover?: boolean,
  walletId?: string,
): Promise<Wallet> =>
  getDirector().joinFederation(inviteCode, walletId, recover)

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
const parseInviteCode = (inviteCode: string): Promise<ParsedInviteCode> =>
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

/** * Generates a new mnemonic phrase for wallet creation.
 * This method sends a request to the WorkerClient to generate a mnemonic.
 * The mnemonic is used for creating a new wallet.
 * @returns {Promise<Mnemonic>} A promise that resolves to an object containing:
 *          - `mnemonic`: The generated mnemonic phrase.
 * @throws {Error} If the WorkerClient encounters an issue during the mnemonic generation process.
 *  * @example
 * const mnemonic = await wallet.generateMnemonic();
 * console.log(mnemonic);
 */
const generateMnemonic = (): Promise<String[]> =>
  getDirector().generateMnemonic()

/**
 * Sets a mnemonic phrase for the wallet.
 * This method sends a request to the WorkerClient to set a mnemonic.
 * @param {string[]} words - The mnemonic words to set.
 * @returns {Promise<boolean>} A promise that resolves to true if the mnemonic was set successfully.
 * @throws {Error} If the WorkerClient encounters an issue during the mnemonic setting process.
 * @example
 * const success = await setMnemonic(['word1', 'word2', ...]);
 * console.log(success);
 */
const setMnemonic = (words: string[]): Promise<boolean> =>
  getDirector().setMnemonic(words)

/**
 * Gets the current mnemonic phrase from the wallet.
 * This method sends a request to the WorkerClient to retrieve the mnemonic.
 * @returns {Promise<string[] | null>} A promise that resolves to the mnemonic words array. If no mnemonic is set, it returns null.
 * @throws {Error} If the WorkerClient encounters an issue during the mnemonic retrieval process.
 * @example
 * const mnemonic = await getMnemonic();
 * console.log(mnemonic);
 */
const getMnemonic = (): Promise<string[] | null> => getDirector().getMnemonic()

/**
 * Checks if a mnemonic is currently set in the wallet.
 *
 * @returns {Promise<boolean>} A promise that resolves to true if a mnemonic is set, false otherwise.
 */
const hasMnemonic = (): Promise<boolean> => getDirector().hasMnemonic()

/**
 * Creates and initializes the WalletDirector with an optional mnemonic.
 * 
 * This function initializes the WalletDirector and either sets the provided mnemonic 
 * or generates a new one if none is provided.
 * 
 * @param {TransportFactory} transport - The transport factory to use for communication
 * @param {string[]} [mnemonic] - Optional mnemonic words to set. If not provided, a new mnemonic will be generated.
 * @returns {Promise<string[]>} A promise that resolves to the mnemonic words that were set
 * @throws {Error} If there's an issue initializing the director or setting the mnemonic
 */
const createWalletDirector = async (
  transport: TransportFactory,
  mnemonic?: string[]
): Promise<void> => {
  try {
    await initializeDirector(transport)
    
    if(!mnemonic || mnemonic.length === 0) {
    await getDirector().generateMnemonic()
    }else{
      await getDirector().setMnemonic(mnemonic)
    }
    logger.info('WalletDirector created and initialized with mnemonic')
  } catch (error) {
    logger.error('Error in createWalletDirector:', error)
    throw error
  }
}

/**
 * Loads the WalletDirector by checking if a mnemonic is set and opening all available wallets.
 * 
 * This function first checks if a mnemonic is set. If it is, it opens all wallets
 * stored in the WalletDirector.
 * 
 * @returns {Promise<boolean>} A promise that resolves to:
 *   - true if a mnemonic is set and all wallets were successfully loaded
 *   - false if no mnemonic is set or if there was an issue loading wallets
 */
const loadWalletDirector = async (transport: TransportFactory): Promise<boolean> => {
  try {
    await initializeDirector(transport) 
    const hasMnemonicSet = await getDirector().hasMnemonic()
    
    if (!hasMnemonicSet) {
      logger.info('No mnemonic set, skipping wallet loading')
      return false
    }
    
    // Get all wallet infos
    const walletInfos = getDirector().listClients()
    
    if (walletInfos.length === 0) {
      logger.info('No wallets found to load')
      return true 
    }
    
    // Open all wallets
    const openPromises = walletInfos.map(info => 
      getDirector().openWallet(info.id)
        .catch(error => {
          logger.error(`Failed to open wallet ${info.id}:`, error)
          return null
        })
    )
    
    const results = await Promise.all(openPromises)
    const successCount = results.filter(wallet => wallet !== null).length
    
    logger.info(`Successfully opened ${successCount} of ${walletInfos.length} wallets`)
    return true
    
  } catch (error) {
    logger.error('Error in loadWalletDirector:', error)
    return false
  }
}



export type * from './types'

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
  generateMnemonic,
  setMnemonic,
  getMnemonic,
  hasMnemonic,

  // Wallet management functions
  listClients,
  getWalletInfo,
  hasWallet,
  getClientName,

  // Utility functions
  cleanup,
  setLogLevel,
  isInitialized,
  loadWalletDirector,
  createWalletDirector,

  // Parse functions
  parseInviteCode,
  previewFederation,
  parseBolt11Invoice,

  // Classes
  Wallet,

  // Transport creation functions
  createTauriTransport,
  createWebWorkerTransport,
}
