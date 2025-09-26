import { FedimintWallet } from '../FedimintWallet'
import { TransportClient } from '../transport/TransportClient'
import { TestingService } from './TestingService'

export class TestFedimintWallet extends FedimintWallet {
  public testing: TestingService

  constructor() {
    super()
    this.testing = new TestingService(this.getTransportClient(), this.lightning)
  }

  async fundWallet(amountMSats: number) {
    const info = await this.testing.getFaucetGatewayInfo()
    const invoice = await this.lightning.createInvoice(
      amountMSats,
      '',
      1000,
      info,
    )
    await Promise.all([
      this.testing.payFaucetInvoice(invoice.invoice),
      this.lightning.waitForReceive(invoice.operation_id),
    ])
  }

  // Method to expose the TransportClient
  getTransportClient(): TransportClient {
    return this['_client']
  }
}
