import { FedimintWallet } from '../FedimintWallet'
import { WorkerClient } from '../worker/WorkerClient'
import { TestingService } from './TestingService'

export class TestFedimintWallet extends FedimintWallet {
  public testing: TestingService

  constructor() {
    super()
    this.testing = new TestingService(this.getWorkerClient(), this.lightning)
  }

  async fundWallet(amount: number) {
    const info = await this.testing.getFaucetGatewayInfo()
    const invoice = await this.lightning.createInvoiceWithGateway(
      amount,
      '',
      info,
    )
    const res = await this.testing.payFaucetInvoice(invoice.invoice)
    await this.lightning.waitForReceive(invoice.operation_id)
    console.error('FUNDED', res)
  }

  // Method to expose the WorkerClient
  getWorkerClient(): WorkerClient {
    return this['_client']
  }
}
