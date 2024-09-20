import { WorkerClient } from './transport/WorkerClient'
import {
  BalanceService,
  MintService,
  LightningService,
  FederationService,
  RecoveryService,
} from './services'

const DEFAULT_CLIENT_NAME = 'fm-default' as const

export class FedimintWallet {
  private client: WorkerClient

  public balance: BalanceService
  public mint: MintService
  public lightning: LightningService
  public federation: FederationService
  public recovery: RecoveryService

  private openPromise: Promise<void> | null = null
  private resolveOpen: () => void = () => {}
  private _isOpen: boolean = false

  /**
   * Creates a new instance of FedimintWallet.
   *
   * @description
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
  constructor(lazy: boolean = false) {
    this.openPromise = new Promise((resolve) => {
      this.resolveOpen = resolve
    })
    this.client = new WorkerClient(new URL('worker.js', import.meta.url))
    this.mint = new MintService(this.client)
    this.lightning = new LightningService(this.client)
    this.balance = new BalanceService(this.client)
    this.federation = new FederationService(this.client)
    this.recovery = new RecoveryService(this.client)

    if (!lazy) {
      this.initialize()
    }
  }

  async initialize() {
    await this.client.initialize()
  }

  async waitForOpen() {
    if (this._isOpen) return Promise.resolve()
    return this.openPromise
  }

  async open(clientName: string = DEFAULT_CLIENT_NAME) {
    await this.client.initialize()
    // TODO: Determine if this should be safe or throw
    if (this._isOpen) throw new Error('The FedimintWallet is already open.')
    const { success } = await this.client.sendSingleMessage('open', {
      clientName,
    })
    if (success) {
      this._isOpen = !!success
      this.resolveOpen()
    }
    return success
  }

  async joinFederation(
    inviteCode: string,
    clientName: string = DEFAULT_CLIENT_NAME,
  ) {
    await this.client.initialize()
    // TODO: Determine if this should be safe or throw
    if (this._isOpen)
      throw new Error(
        'The FedimintWallet is already open. You can only call `joinFederation` on closed clients.',
      )
    const response = await this.client.sendSingleMessage('join', {
      inviteCode,
      clientName,
    })
    if (response.success) {
      this._isOpen = true
      this.resolveOpen()
    }
  }

  /**
   * This should ONLY be called when UNLOADING the wallet client.
   * After this call, the FedimintWallet instance should be discarded.
   */
  async cleanup() {
    this.openPromise = null
    this._isOpen = false
    this.client.cleanup()
  }

  isOpen() {
    return this._isOpen
  }
}
