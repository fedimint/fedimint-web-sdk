# List Operations

### `federation.listOperations(limit?:number,lastseen:lastSeenRequest)`

Returns a paginated list of operations (transactions) from the federation. In case limit and lastseen not given, returns all the available operations.

```ts twoslash
// @esModuleInterop
import { FedimintWallet } from '@fedimint/core-web'

const wallet = new FedimintWallet()
wallet.open()

const limit = 10
const lastseen = {
  creation_time: { secs_since_epoch: 2323233, nanos_since_epoch: 93429234 },
  operation_id:
    '3ff56b29cf014b9ff6c8b6b4aa78e02d3c429de7112bfaf42a876f6a797ddf8b',
}
const operations = await wallet.federation.listOperations(limit, lastseen)
```
