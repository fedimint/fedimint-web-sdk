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
    // try {
    //   const invoice = await this.lightning.createInvoiceWithGateway(
    //     amount,
    //     '',
    //     gateways[0].info,
    //   )
    //   console.error('gateway 0', gateways[0].info.api)
    //   const res = await this.testing.payFaucetInvoice(invoice.invoice)
    //   await this.lightning.waitForReceive(invoice.operation_id)
    //   console.error('First success', res)
    // } catch (e) {
    //   console.error('Fail for first', e)
    // }
    // try {
    //   const invoice = await this.lightning.createInvoiceWithGateway(
    //     amount,
    //     '',
    //     gateways[1].info,
    //   )
    //   console.error('gateway 1', gateways[1].info.api)
    //   const res = await this.testing.payFaucetInvoice(invoice.invoice)
    //   await this.lightning.waitForReceive(invoice.operation_id)
    //   console.error('Second success', res)
    // } catch (e) {
    //   console.error('Fail for second', e)
    // }
    // console.error('INVOICE', invoice)
    // console.error('RES', res)
    // await this.lightning.waitForReceive(invoice.operation_id)
  }

  // Method to expose the WorkerClient
  getWorkerClient(): WorkerClient {
    return this['_client']
  }
}
