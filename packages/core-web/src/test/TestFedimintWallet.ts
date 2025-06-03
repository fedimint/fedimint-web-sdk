import { FedimintWallet } from '../FedimintWallet'
import { RpcClient } from '../rpc'
import { TestingService } from './TestingService'

export class TestFedimintWallet extends FedimintWallet {
  public testing: TestingService

  constructor() {
    super()
    this.testing = new TestingService(this.getWorkerClient(), this.lightning)
  }

  async fundWallet(amount: number) {
    const info = await this.testing.getFaucetGatewayInfo()
    const invoice = await this.lightning.createInvoice(amount, '', 1000, info)
    await Promise.all([
      this.testing.payFaucetInvoice(invoice.invoice),
      this.lightning.waitForReceive(invoice.operation_id),
    ])
  }

  // Method to expose the WorkerClient
  getWorkerClient(): RpcClient {
    return this['_client']
  }
}
