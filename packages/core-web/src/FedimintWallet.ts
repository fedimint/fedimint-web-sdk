import { RpcClient, TransportFactory } from './rpc'
import { createWebWorkerTransport } from './worker/WorkerTransport'
import {
  BalanceService,
  MintService,
  LightningService,
  FederationService,
  RecoveryService,
  WalletService,
} from './services'
import { logger, type LogLevel } from './utils/logger'

const DEFAULT_CLIENT_NAME = 'fm-default' as const

export class FedimintWallet {
  private _client: RpcClient

  public balance: BalanceService
  public mint: MintService
  public lightning: LightningService
  public federation: FederationService
  public recovery: RecoveryService
  public wallet: WalletService

  private _openPromise: Promise<void> | undefined = undefined
  private _resolveOpen: () => void = () => {}
  private _isOpen: boolean = false

  /**
   * Creates a new instance of FedimintWallet.
   *
   * This constructor initializes a FedimintWallet instance, which manages communication
   * with a Web Worker. The Web Worker is responsible for running WebAssembly code that
   * handles the core Fedimint Client operations.
   *
   * (default) When not in lazy mode, the constructor immediately initializes the
   * Web Worker and begins loading the WebAssembly module in the background. This
   * allows for faster subsequent operations but may increase initial load time.
   *
   * In lazy mode, the Web Worker and WebAssembly initialization are deferred until
   * the first operation that requires them, reducing initial overhead at the cost
   * of a slight delay on the first operation.
   *
   * @param {boolean} lazy - If true, delays Web Worker and WebAssembly initialization
   *                         until needed. Default is false.
   *
   * @example
   * // Create a wallet with immediate initialization
   * const wallet = new FedimintWallet();
   * wallet.open();
   *
   * // Create a wallet with lazy initialization
   * const lazyWallet = new FedimintWallet(true);
   * // Some time later...
   * lazyWallet.initialize();
   * lazyWallet.open();
   */
  constructor(
    lazy: boolean = false,
    createTransport: TransportFactory = createWebWorkerTransport,
  ) {
    this._openPromise = new Promise((resolve) => {
      this._resolveOpen = resolve
    })
    this._client = new RpcClient(createTransport)
    this.mint = new MintService(this._client)
    this.lightning = new LightningService(this._client)
    this.balance = new BalanceService(this._client)
    this.federation = new FederationService(this._client)
    this.recovery = new RecoveryService(this._client)
    this.wallet = new WalletService(this._client)

    logger.info('FedimintWallet instantiated')

    if (!lazy) {
      this.initialize()
    }
  }

  async initialize() {
    logger.info('Initializing RpcClient')
    await this._client.initialize()
    logger.info('RpcClient initialized')
  }

  async waitForOpen() {
    if (this._isOpen) return Promise.resolve()
    return this._openPromise
  }

  async open(clientName: string = DEFAULT_CLIENT_NAME) {
    // If already open with the same client name, return success
    if (this._isOpen) {
      logger.warn('Wallet is already open')
      return true
    }

    await this.initialize()

    try {
      await this._client.openClient(clientName)
      this._isOpen = true
      this._resolveOpen()
      return true
    } catch (e) {
      logger.error('Error opening client', e)
      return false
    }
  }

  async joinFederation(
    inviteCode: string,
    clientName: string = DEFAULT_CLIENT_NAME,
  ) {
    await this.initialize()
    // TODO: Determine if this should be safe or throw
    if (this._isOpen)
      throw new Error(
        'The FedimintWallet is already open. You can only call `joinFederation` on closed clients.',
      )
    try {
      await this._client.joinFederation(inviteCode, clientName)
      this._isOpen = true
      this._resolveOpen()
      logger.info('Successfully joined federation and opened client')
      return true
    } catch (e) {
      logger.error('Error joining federation', e)
      // Ensure we don't leave the wallet in an inconsistent state
      this._isOpen = false
      return false
    }
  }

  /**
   * Previews a federation using the provided invite code.
   *
   * This method sends the invite code to the WorkerClient to preview the federation
   * details without joining it. The response includes API endpoints, configs and
   * federation id.
   *
   * @param {string} inviteCode - The invite code for the federation to be previewed.
   * @returns {Promise<any>} A promise that resolves to the federation details.
   *
   * @throws {Error} If the WorkerClient encounters an issue during the preview process.
   *
   * @example
   * const inviteCode = "example-invite-code";
   * const federationDetails = await wallet.previewFederation(inviteCode);
   * console.log(federationDetails);
   */
  async previewFederation(inviteCode: string) {
    try {
      logger.debug('Previewing federation with invite code:', inviteCode)
      const result = await this._client.previewFederation(inviteCode)
      logger.debug('Federation preview result:', result)
      return result
    } catch (error) {
      logger.error('Error previewing federation:', error)
      throw new Error(`Failed to preview federation: ${error}`)
    }
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
  async parseBolt11Invoice(invoice: string) {
    try {
      logger.debug('Parsing BOLT11 invoice:', invoice)
      const result = await this._client.parseBolt11Invoice(invoice)
      logger.debug('Parsed invoice result:', result)
      return result
    } catch (error) {
      logger.error('Error parsing BOLT11 invoice:', error)
      throw new Error(`Failed to parse BOLT11 invoice: ${error}`)
    }
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
  async parseInviteCode(inviteCode: string) {
    try {
      logger.debug('Parsing invite code:', inviteCode)
      const result = await this._client.parseInviteCode(inviteCode)
      logger.debug('Parsed invite code result:', result)
      return result
    } catch (error) {
      logger.error('Error parsing invite code:', error)
      throw new Error(`Failed to parse invite code: ${error}`)
    }
  }

  /**
   * This should ONLY be called when UNLOADING the wallet client.
   * After this call, the FedimintWallet instance should be discarded.
   */
  async cleanup() {
    this._openPromise = undefined
    this._isOpen = false
    await this._client.cleanup()
  }

  isOpen() {
    return this._isOpen
  }

  /**
   * Sets the log level for the library.
   * @param level The desired log level ('DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE').
   */
  setLogLevel(level: LogLevel) {
    logger.setLevel(level)
    logger.info(`Log level set to ${level}.`)
  }

  // Debug/Testing methods
  _getActiveSubscriptionIds(): number[] {
    return this._client._getActiveSubscriptionIds()
  }

  _getActiveSubscriptionCount(): number {
    return this._client._getActiveSubscriptionCount()
  }

  _getRequestCounter(): number {
    return this._client._getRequestCounter()
  }
}
