import { useEffect, useRef, useState } from 'react'
import type { Amount, FederationLike } from '@fedimint/react-native-bindings'

/** The pull cursor every generated `…Updates` object has. */
interface Updates<T> {
  next(asyncOpts_?: { signal: AbortSignal }): Promise<T | undefined>
}

/** Any generated operation (`EcashSendOperationLike`, `LnReceiveOperationLike`, …). */
export interface ObservableOperation<S> {
  id(): string
  updates(): Updates<S>
}

/**
 * The federation's balance in msat, live. `undefined` until the first value arrives, and while
 * `federation` is `undefined`.
 *
 * The subscription is keyed on `federation.id()`, so a new handle for the same federation does
 * not restart it. A stream that fails (`FederationClosed` once the federation or the SDK is
 * closed) is reported to `onError` and not retried. To watch again after reopening, remount the
 * component, for example with a React `key`.
 */
export function useBalance(
  federation: FederationLike | undefined,
  onError?: (err: unknown) => void,
): Amount | undefined {
  return useUpdates(federation, (f) => f.balanceUpdates(), onError)
}

/**
 * The operation's state, live. `undefined` until the first state arrives, and while
 * `operation` is `undefined`. The final state stays after the stream ends.
 *
 * Keyed on `operation.id()`. A failure to observe is reported to `onError` and not retried; it
 * is never the operation's outcome, which is a state.
 */
export function useOperation<S>(
  operation: ObservableOperation<S> | undefined,
  onError?: (err: unknown) => void,
): S | undefined {
  return useUpdates(operation, (o) => o.updates(), onError)
}

/**
 * Pulls `open(source)`'s cursor while `source.id()` stays the same. The first `next()` is the
 * current value, and `undefined` is the clean end. Unmounting or a new id aborts the pending
 * `next()`.
 */
function useUpdates<Source extends { id(): string }, T>(
  source: Source | undefined,
  open: (source: Source) => Updates<T>,
  onError: ((err: unknown) => void) | undefined,
): T | undefined {
  const key = source?.id()
  const [latest, setLatest] = useState<{ key: string; value: T }>()
  // Read when the subscription starts or fails, so new objects each render do not resubscribe.
  const sourceRef = useRef(source)
  sourceRef.current = source
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useEffect(() => {
    const current = sourceRef.current
    if (key === undefined || current === undefined) return
    const controller = new AbortController()
    const { signal } = controller
    const pull = async () => {
      try {
        const updates = open(current)
        for (;;) {
          const value = await updates.next({ signal })
          if (signal.aborted || value === undefined) return
          setLatest({ key, value })
        }
      } catch (err) {
        if (!signal.aborted) onErrorRef.current?.(err)
      }
    }
    void pull()
    return () => {
      controller.abort()
      // Without this, the same id coming back would show the old value until its cursor yields.
      setLatest(undefined)
    }
  }, [key])

  return latest !== undefined && latest.key === key ? latest.value : undefined
}
