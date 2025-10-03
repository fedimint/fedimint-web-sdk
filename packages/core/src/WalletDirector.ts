import { TransportClient } from './transport'
import { type LogLevel } from './utils/logger'
import { FederationConfig, JSONValue } from './types'
import {
  Transport,
  ParsedInviteCode,
  ParsedBolt11Invoice,
  PreviewFederation,
} from '@fedimint/types'
import { FedimintWallet } from './FedimintWallet'

export class WalletDirector {
  // Protected to allow for TestWalletDirector to access the client
  protected _client: TransportClient

  /**
   * Creates a new instance of WalletDirector.
   *
   * @param {Transport} [transport] - Optional worker client instance. Provide your
   *                         own to use a custom transport (e.g. React Native).
   *
   * @param {boolean} lazy - If true, delays Web Worker and WebAssembly initialization
   *                         until needed. Default is false.
   */
  constructor(transport: Transport, lazy: boolean = false) {
    if (!transport) {
      throw new Error('WalletDirector requires a transport implementation')
    }
    this._client = new TransportClient(transport)
    this._client.logger.info('WalletDirector instantiated')
    if (!lazy) {
      this.initialize()
    }
  }

  async initialize() {
    this._client.logger.info('Initializing TransportClient')
    await this._client.initialize()
    this._client.logger.info('TransportClient initialized')
  }

  // TODO: Make this stateful... handle listing/joining/opening/closing wallets at this level
  async createWallet() {
    await this._client.initialize()
    return new FedimintWallet(this._client)
  }

  /**
   * Sets the log level for the library.
   * @param level The desired log level ('DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE').
   */
  setLogLevel(level: LogLevel) {
    this._client.logger.setLevel(level)
    this._client.logger.info(`Log level set to ${level}.`)
  }

  /**
   * Parses a federation invite code and retrieves its details.
   *
   * This method sends the provided invite code to the TransportClient for parsing.
   * The response includes the federation_id and url.
   *
   * @param {string} inviteCode - The invite code to be parsed.
   * @returns {Promise<ParsedInviteCode>}
   *          A promise that resolves to an object containing:
   *          - `federation_id`: The id of the federation.
   *          - `url`: One of the apipoints to connect to the federation
   *
   * @throws {Error} If the TransportClient encounters an issue during the parsing process.
   *
   * @example
   * const inviteCode = "example-invite-code";
   * const parsedCode = await walletDirector.parseInviteCode(inviteCode);
   * console.log(parsedCode.federation_id, parsedCode.url);
   */
  async parseInviteCode(inviteCode: string): Promise<ParsedInviteCode> {
    await this._client.initialize()
    return this._client.parseInviteCode(inviteCode)
  }

  /**
   * Parses a BOLT11 Lightning invoice and retrieves its details.
   *
   * This method sends the provided invoice string to the TransportClient for parsing.
   * The response includes details such as the amount, expiry, and memo.
   *
   * @param {string} invoiceStr - The BOLT11 invoice string to be parsed.
   * @returns {Promise<ParsedBolt11Invoice>}
   *          A promise that resolves to an object containing:
   *          - `amount`: The amount specified in the invoice (in satoshis).
   *          - `expiry`: The expiry time of the invoice in seconds.
   *          - `memo`: A description or memo attached to the invoice.
   *
   * @throws {Error} If the TransportClient encounters an issue during the parsing process.
   *
   * @example
   * const invoiceStr = "lnbc1...";
   * const parsedInvoice = await walletDirector.parseBolt11Invoice(invoiceStr);
   * console.log(parsedInvoice.amount, parsedInvoice.expiry, parsedInvoice.memo);
   */
  async parseBolt11Invoice(invoiceStr: string): Promise<ParsedBolt11Invoice> {
    await this._client.initialize()
    return this._client.parseBolt11Invoice(invoiceStr)
  }

  /**
   * Previews the configuration of a federation using the provided invite code.
   *
   * Retrieves and returns the federation configuration
   * associated with the given invite code.
   *
   * @param inviteCode - The invite code used to identify the federation to preview.
   * @returns {Promise<PreviewFederation>} A promise that resolves to a `PreviewFederation` object containing the federation's
   * configuration and ID.
   * @example
   * const inviteCode = "example-invite-code";
   * const federationPreview = await walletDirector.previewFederation(inviteCode);
   * console.log(federationPreview.config, federationPreview.federation_id);
   */
  async previewFederation(inviteCode: string): Promise<PreviewFederation> {
    return await this._client.previewFederation(inviteCode)
  }

  async generateMnemonic(): Promise<string[]> {
    const result = await this._client.generateMnemonic()
    return result.mnemonic
  }

  async getMnemonic(): Promise<string[]> {
    const result = await this._client.getMnemonic()
    return result.mnemonic
  }

  async setMnemonic(words: string[]): Promise<boolean> {
    const result = await this._client.setMnemonic(words)
    return result.success
  }
}
