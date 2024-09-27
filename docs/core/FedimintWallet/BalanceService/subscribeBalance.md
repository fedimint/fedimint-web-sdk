# Subscribe Balance

### `balance.subscribeBalance()` <Badge type="info" text="Streaming" />

Subscribe to balance updates as they occur.

```ts
// const wallet = new FedimintWallet()
// wallet.open()

const unsubscribe = wallet.balance.subscribeBalance((mSats) => {
  console.log('Balance updated:', mSats)
  // 1000 mSats = 1 satoshi
})

// ...Cleanup Later
unsubscribe()
```
