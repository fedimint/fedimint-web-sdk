import { createElement, startTransition, Suspense } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { describe, expect, it, vi } from 'vitest'
import type { FederationLike } from '@fedimint/react-native-bindings'
import { useBalance, useOperation, type ObservableOperation } from '../react'
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

function cursor<T>() {
  const signals: AbortSignal[] = []
  const queued: Array<{ value?: T; error?: unknown }> = []
  let waiting: ((step: { value?: T; error?: unknown }) => void) | undefined
  const step = (s: { value?: T; error?: unknown }) => {
    if (waiting) {
      const w = waiting
      waiting = undefined
      w(s)
    } else queued.push(s)
  }
  return {
    signals,
    uniffiDestroy: vi.fn(),
    push: (value: T | undefined) => act(async () => step({ value })),
    fail: (error: unknown) => act(async () => step({ error })),
    next: vi.fn(({ signal }: { signal: AbortSignal }) => {
      signals.push(signal)
      return new Promise<T | undefined>((resolve, reject) => {
        const settle = (s: { value?: T; error?: unknown }) =>
          'error' in s ? reject(s.error) : resolve(s.value)
        const first = queued.shift()
        if (first) settle(first)
        else waiting = settle
        signal.addEventListener('abort', () => reject(new Error('AbortError')))
      })
    }),
  }
}

const federation = (id: string, updates: { next: unknown }) =>
  ({
    id: () => id,
    balanceUpdates: vi.fn(() => updates),
  }) as unknown as FederationLike & { balanceUpdates: ReturnType<typeof vi.fn> }

const operation = <S>(id: string, updates: { next: unknown }) =>
  ({
    id: () => id,
    updates: vi.fn(() => updates),
  }) as unknown as ObservableOperation<S> & {
    updates: ReturnType<typeof vi.fn>
  }

function renderBalance(
  fed: FederationLike | undefined,
  onError?: (e: unknown) => void,
) {
  const seen: Array<bigint | undefined> = []
  const Probe = ({ f }: { f: FederationLike | undefined }) => {
    seen.push(useBalance(f, onError))
    return null
  }
  let root!: ReactTestRenderer
  act(() => {
    root = create(createElement(Probe, { f: fed }))
  })
  const rerender = (f: FederationLike | undefined) =>
    act(() => root.update(createElement(Probe, { f })))
  return { seen, root, rerender }
}

describe('useBalance', () => {
  it('is undefined without a federation', () => {
    const { seen } = renderBalance(undefined)
    expect(seen).toEqual([undefined])
  })

  it('stops and opens nothing new when the federation goes away', async () => {
    const c = cursor<bigint>()
    const fed = federation('fed-a', c)
    const { seen, rerender } = renderBalance(fed)
    await c.push(1_000n)
    rerender(undefined)
    expect(c.signals[0]?.aborted).toBe(true)
    expect(fed.balanceUpdates).toHaveBeenCalledTimes(1)
    expect(seen[seen.length - 1]).toBeUndefined()
  })

  it('does not show the old balance when the same id comes back', async () => {
    const first = cursor<bigint>()
    const { seen, rerender } = renderBalance(federation('fed-a', first))
    await first.push(1_000n)
    rerender(undefined)
    const second = cursor<bigint>()
    rerender(federation('fed-a', second))
    expect(seen[seen.length - 1]).toBeUndefined()
    await second.push(2_000n)
    expect(seen[seen.length - 1]).toBe(2_000n)
  })

  it('renders each balance the cursor yields', async () => {
    const c = cursor<bigint>()
    const { seen } = renderBalance(federation('fed-a', c))
    await c.push(1_000n)
    await c.push(2_500n)
    expect(seen).toEqual([undefined, 1_000n, 2_500n])
  })

  it('aborts the pending next on unmount', async () => {
    const c = cursor<bigint>()
    const { root } = renderBalance(federation('fed-a', c))
    await act(async () => {})
    expect(c.signals[0]?.aborted).toBe(false)
    act(() => root.unmount())
    expect(c.signals[0]?.aborted).toBe(true)
  })

  it('keeps one subscription across new handles with the same id', async () => {
    const c = cursor<bigint>()
    const first = federation('fed-a', c)
    const { rerender } = renderBalance(first)
    const second = federation('fed-a', cursor<bigint>())
    rerender(second)
    await c.push(1_000n)
    expect(first.balanceUpdates).toHaveBeenCalledTimes(1)
    expect(second.balanceUpdates).not.toHaveBeenCalled()
  })

  it('drops the old balance and resubscribes when the id changes', async () => {
    const a = cursor<bigint>()
    const b = cursor<bigint>()
    const { seen, rerender } = renderBalance(federation('fed-a', a))
    await a.push(1_000n)
    rerender(federation('fed-b', b))
    expect(seen[seen.length - 1]).toBeUndefined()
    expect(a.signals[0]?.aborted).toBe(true)
    await b.push(7n)
    expect(seen[seen.length - 1]).toBe(7n)
  })

  it('reports a failure once and does not retry', async () => {
    const c = cursor<bigint>()
    const onError = vi.fn()
    const fed = federation('fed-a', c)
    renderBalance(fed, onError)
    const closed = new Error('FederationClosed')
    await c.fail(closed)
    await act(async () => {})
    expect(onError).toHaveBeenCalledExactlyOnceWith(closed)
    expect(fed.balanceUpdates).toHaveBeenCalledTimes(1)
    expect(c.next).toHaveBeenCalledTimes(1)
  })

  it('clears the balance when the stream fails', async () => {
    const c = cursor<bigint>()
    const { seen } = renderBalance(federation('fed-a', c), vi.fn())
    await c.push(1_000n)
    await c.fail(new Error('FederationClosed'))
    await act(async () => {})
    expect(seen[seen.length - 1]).toBeUndefined()
  })

  it('logs an onError that throws instead of rejecting', async () => {
    const c = cursor<bigint>()
    const thrown = new Error('handler bug')
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      renderBalance(federation('fed-a', c), () => {
        throw thrown
      })
      await c.fail(new Error('FederationClosed'))
      await act(async () => {})
      // Vitest fails the run on an unhandled rejection, so reaching here with the log is the check.
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(logged).toHaveBeenCalledWith(thrown)
    } finally {
      logged.mockRestore()
    }
  })

  it('destroys the cursor once on unmount', async () => {
    const c = cursor<bigint>()
    const { root } = renderBalance(federation('fed-a', c))
    await act(async () => {})
    await act(async () => root.unmount())
    expect(c.uniffiDestroy).toHaveBeenCalledTimes(1)
  })

  it('destroys the old cursor and keeps the new one when the id changes', async () => {
    const a = cursor<bigint>()
    const b = cursor<bigint>()
    const { rerender } = renderBalance(federation('fed-a', a))
    await act(async () => {})
    await act(async () => rerender(federation('fed-b', b)))
    expect(a.uniffiDestroy).toHaveBeenCalledTimes(1)
    expect(b.uniffiDestroy).not.toHaveBeenCalled()
  })

  it('destroys the cursor when the federation goes away', async () => {
    const c = cursor<bigint>()
    const { rerender } = renderBalance(federation('fed-a', c))
    await act(async () => {})
    await act(async () => rerender(undefined))
    expect(c.uniffiDestroy).toHaveBeenCalledTimes(1)
  })

  it('destroys the cursor once after a failure is reported', async () => {
    const c = cursor<bigint>()
    const onError = vi.fn()
    renderBalance(federation('fed-a', c), onError)
    await c.fail(new Error('FederationClosed'))
    await act(async () => {})
    expect(onError).toHaveBeenCalledOnce()
    expect(c.uniffiDestroy).toHaveBeenCalledTimes(1)
  })

  it('does not destroy the cursor for a new handle with the same id', async () => {
    const c = cursor<bigint>()
    const { rerender } = renderBalance(federation('fed-a', c))
    await act(async () => {})
    await act(async () => rerender(federation('fed-a', cursor<bigint>())))
    expect(c.uniffiDestroy).not.toHaveBeenCalled()
  })

  it('reports a failure to the committed onError, not one from an abandoned render', async () => {
    const c = cursor<bigint>()
    const committed = vi.fn()
    const abandoned = vi.fn()
    const fed = federation('fed-a', c)
    const never = new Promise<never>(() => {})
    const Suspender = ({ on }: { on: boolean }) => {
      if (on) throw never
      return null
    }
    const Probe = ({ onError }: { onError: (e: unknown) => void }) => {
      useBalance(fed, onError)
      return null
    }
    const tree = (onError: (e: unknown) => void, suspend: boolean) =>
      createElement(
        Suspense,
        { fallback: null },
        createElement(Probe, { onError }),
        createElement(Suspender, { on: suspend }),
      )
    // A transition can only be abandoned on a concurrent root. The runtime reads this option,
    // but `@types/react-test-renderer` does not declare it.
    const concurrent = {
      createNodeMock: () => null,
      unstable_isConcurrent: true,
    }
    let root!: ReactTestRenderer
    act(() => {
      root = create(tree(committed, false), concurrent)
    })
    await act(async () => {
      startTransition(() => root.update(tree(abandoned, true)))
    })
    const closed = new Error('FederationClosed')
    await c.fail(closed)
    await act(async () => {})
    expect(abandoned).not.toHaveBeenCalled()
    expect(committed).toHaveBeenCalledExactlyOnceWith(closed)
  })

  it('does not report the abort it causes', async () => {
    const c = cursor<bigint>()
    const onError = vi.fn()
    const { root } = renderBalance(federation('fed-a', c), onError)
    await act(async () => {})
    await act(async () => root.unmount())
    expect(onError).not.toHaveBeenCalled()
  })
})

describe('useOperation', () => {
  it('renders each state and keeps the final one after the stream ends', async () => {
    type State = { tag: 'Pending' } | { tag: 'Success' }
    const c = cursor<State>()
    const op = operation<State>('op-1', c)
    const seen: Array<State | undefined> = []
    const Probe = () => {
      seen.push(useOperation(op))
      return null
    }
    act(() => {
      create(createElement(Probe))
    })
    await c.push({ tag: 'Pending' })
    await c.push({ tag: 'Success' })
    await c.push(undefined)
    expect(seen).toEqual([undefined, { tag: 'Pending' }, { tag: 'Success' }])
    expect(c.next).toHaveBeenCalledTimes(3)
    expect(op.updates).toHaveBeenCalledTimes(1)
    expect(c.uniffiDestroy).toHaveBeenCalledTimes(1)
  })
})
