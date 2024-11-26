import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { FedimintWallet } from '@fedimint/core-web'
import { wallet } from './fedimint'

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('fedimint-wallet')
export class Fedimint extends LitElement {
  wallet: FedimintWallet

  private _balanceCleanup: undefined | (() => void)

  private _setupSubscriptions() {
    this._balanceCleanup = this.wallet.balance.subscribeBalance(
      (balanceMsats) => {
        console.warn('balance', balanceMsats)
        this.balance = balanceMsats / 1000
      },
    )
  }

  private _teardownSubscriptions() {
    this._balanceCleanup?.()
  }

  constructor() {
    super()
    this.wallet = wallet
  }

  async connectedCallback() {
    super.connectedCallback()
    console.warn('connectedCallback')
    const isOpen = await this.wallet.open()
    console.warn('isOpen', isOpen)
    if (isOpen) {
      this._setupSubscriptions()
    }
  }

  disconnectedCallback() {
    console.warn('disconnectedCallback')
    super.disconnectedCallback()
    this._teardownSubscriptions()
  }

  @property({ type: Number, reflect: true })
  balance = 0

  render() {
    return html` <p>Balance is ${this.balance}</p> `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'fedimint-wallet': Fedimint
  }
}
