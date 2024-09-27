import { WorkerClient } from '../worker'

// This is a testing service that allows for inspecting the internals
// of the WorkerClient. It is not intended for use in production.
export class TestingService {
  constructor(private client: WorkerClient) {}

  getRequestCounter() {
    return this.client._getRequestCounter()
  }

  getRequestCallbackMap() {
    return this.client._getRequestCallbackMap()
  }
}
