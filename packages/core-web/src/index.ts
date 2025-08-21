import { getDirector, initializeDirector } from './WalletDirector'
import { Wallet } from './Wallet'
import {
  WalletInfo,
  ParsedBolt11Invoice,
  ParsedInviteCode,
  PreviewFederation,
} from './types'
import { logger, type LogLevel } from './utils/logger'
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
  walletId?: string,
): Promise<Wallet> => getDirector().joinFederation(inviteCode, walletId)

const recoverFederationFromScratch = (
  inviteCode: string,
  walletId?: string,
): Promise<Wallet> =>
  getDirector().recoverFederationFromScratch(inviteCode, walletId)

/**
 * Opens an existing wallet by its ID.
 *
 * If the wallet does not exist, it throws an error.
 * If the wallet is already open, it returns the existing instance.
 *
 * @param {string} walletId - The ID of the wallet to open.
 * @returns {Promise<Wallet>} A promise that resolves to the opened Wallet instance.
 * @throws {Error} If the wallet with the specified ID does not exist.
 */
const openWallet = (walletId: string): Promise<Wallet> =>
  getDirector().openWallet(walletId)

/**
 * Retrieves an existing wallet by its ID.
 *
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
 * Retrieves wallet info by its ID.
 *
 * If the wallet with the specified ID does not exist, it returns undefined.
 *
 * @param {string} walletId - The ID of the wallet to retrieve info for.
 * @returns {WalletInfo | undefined} An object containing wallet information,
 *                                   or undefined if the wallet does not exist.
 */
const getWalletInfo = (walletId: string): WalletInfo | undefined =>
  getDirector().getWalletInfo(walletId)

/**
 * Checks if a wallet with the specified ID exists.
 *
 * @param {string} walletId - The ID of the wallet to check.
 * @returns {boolean} True if the wallet exists, false otherwise.
 */
const hasWallet = (walletId: string): boolean =>
  getDirector().hasWallet(walletId)

/**
 * Removes a wallet by its ID.
 *
 * This method cleans up the wallet resources and removes it from
 * the registry.
 *
 * @param {string} walletId - The ID of the wallet to remove.
 * @returns {void}
 */
const removeWallet = (walletId: string): void =>
  getDirector().removeWallet(walletId)

/**
 * Sets the global log level.
 *
 * @param {LogLevel} level - The log level to set.
 * @returns {void}
 */
const setLogLevel = (level: LogLevel): void => getDirector().setLogLevel(level)

/**
 * Parses an invite code to extract federation details.
 *
 * @param {string} inviteCode - The invite code to parse.
 * @returns {Promise<ParsedInviteCode>} A promise that resolves to an object
 *                                      containing the parsed invite code details.
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

/**
 * Generates a new mnemonic phrase for wallet creation.
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
  mnemonic?: string[],
): Promise<void> => {
  try {
    await initializeDirector(transport)

    if (!mnemonic || mnemonic.length === 0) {
      await getDirector().generateMnemonic()
    } else {
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
const loadWalletDirector = async (
  transport: TransportFactory,
): Promise<boolean> => {
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
    const openPromises = walletInfos.map((info) =>
      getDirector()
        .openWallet(info.id)
        .catch((error) => {
          logger.error(`Failed to open wallet ${info.id}:`, error)
          return null
        }),
    )

    const results = await Promise.all(openPromises)
    const successCount = results.filter((wallet) => wallet !== null).length

    logger.info(
      `Successfully opened ${successCount} of ${walletInfos.length} wallets`,
    )
    return true
  } catch (error) {
    logger.error('Error in loadWalletDirector:', error)
    return false
  }
}

export type * from './types'

// Export all functions and the class
// Functions to check and modify wallet recovery state
/**
 * Checks if a wallet is currently in recovery mode
 *
 * When a wallet is in recovery mode, most operations will be disabled except for:
 * - Recovery-related methods
 * - Balance tracking methods
 *
 * @param {Wallet} wallet - The wallet to check
 * @returns {boolean} True if the wallet is in recovery mode, false otherwise
 */
const isWalletRecovering = (wallet: Wallet): boolean => wallet.isRecovering

export {
  // Core wallet functions
  initialize,
  joinFederation,
  recoverFederationFromScratch,
  openWallet,
  removeWallet,
  getWallet,
  getActiveWallets,
  getWalletsByFederation,
  generateMnemonic,
  setMnemonic,
  getMnemonic,
  hasMnemonic,
  isWalletRecovering,

  // Wallet management functions
  listClients,
  getWalletInfo,
  hasWallet,

  // Utility functions
  setLogLevel,
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
