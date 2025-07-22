import { LightningService } from '../services'
import { RpcClient } from '../rpc'

// This is a testing service that allows for inspecting the internals
// of the WorkerClient. It is not intended for use in production.
export class TestingService {
  public TESTING_INVITE: string
  constructor(
    private client: RpcClient,
    private lightning: LightningService,
  ) {
    // Solo Mint on mutinynet
  }

  getRequestCounter() {
    return this.client._getRequestCounter()
  }
}
