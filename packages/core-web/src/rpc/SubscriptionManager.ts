import type { CancelFunction, RpcResponse, JSONValue } from '../types'
import { logger } from '../utils/logger'

export type Subscription = {
  id: number
  onData: (data: any) => void
  onError: (error: string) => void
  onEnd: () => void
}

export class SubscriptionManager {
  private subscriptions = new Map<number, Subscription>()
  private cancelRequest: (requestId: number) => void

  constructor(cancelRequest: (requestId: number) => void) {
    this.cancelRequest = cancelRequest
  }

  addSubscription<T extends JSONValue = JSONValue>(
    id: number,
    onData: (data: T) => void,
    onError: (error: string) => void,
    onEnd: () => void = () => {},
  ): CancelFunction {
    // const abortController = new AbortController()
    // abortController.signal.addEventListener('abort', () => {
    //   this.cancelSubscription(id)
    // })
    // const cancelFn = () => {
    //   this.cancelSubscription(id)
    // }

    const subscription = {
      id,
      onData,
      onError,
      onEnd,
    }

    this.subscriptions.set(id, subscription)

    return () => this.cancelSubscription(id)
  }

  handleResponse(requestId: number, response: RpcResponse) {
    const subscription = this.subscriptions.get(requestId)

    if (!subscription) {
      logger.warn(
        'SubscriptionManager - handleResponse - received message with no subscription',
        requestId,
        response,
      )
      return
    }

    switch (response.type) {
      case 'data':
        subscription.onData(response.data)
        break
      case 'error':
        subscription.onError(response.error)
        this.removeSubscription(requestId)
        break
      case 'end':
        subscription.onEnd()
        this.removeSubscription(requestId)
        break
      case 'aborted':
        subscription.onEnd()
        this.removeSubscription(requestId)
        break
      case 'log':
        logger.debug('SubscriptionManager - handleResponse', response)
        break
    }
  }

  cancelSubscription(id: number) {
    const subscription = this.subscriptions.get(id)
    if (subscription) {
      this.cancelRequest(id)
      this.removeSubscription(id)
    }
  }

  private removeSubscription(id: number) {
    this.subscriptions.delete(id)
  }

  cancelAll() {
    const subscriptionIds = Array.from(this.subscriptions.keys())
    subscriptionIds.forEach((id) => this.cancelSubscription(id))
  }

  clear() {
    this.subscriptions.clear()
  }

  // For testing/debugging
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size
  }

  getActiveSubscriptionIds(): number[] {
    return Array.from(this.subscriptions.keys())
  }
}
