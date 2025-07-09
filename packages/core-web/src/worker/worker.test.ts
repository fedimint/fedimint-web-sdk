import { expect } from 'vitest'
import { TESTING_INVITE } from '../test/TestingService'
import { JSONObject } from '../types'
import { workerTest } from '../test/fixtures'

// Waits for a message of a given type from the worker
const waitForWorkerResponse = (
  worker: Worker,
  messageType: string,
): Promise<JSONObject> => {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      if (event.data.type === messageType) {
        resolve(event.data)
      } else if (event.data.type === 'error') {
        reject(event.data.error)
      }
    }
    worker.onerror = (error) => {
      reject(error.message)
    }
  })
}

workerTest(
  'should initialize RpcHandler on init message',
  async ({ worker }) => {
    worker.postMessage({ type: 'init', request_id: 1 })
    const response = await waitForWorkerResponse(worker, 'init_success')
    expect(response.request_id).toEqual(1)
  },
)

workerTest(
  'should handle open_client message',
  async ({ worker, clientName }) => {
    worker.postMessage({ type: 'init', request_id: 1 })
    await waitForWorkerResponse(worker, 'init_success')

    worker.postMessage({
      type: 'open_client',
      request_id: 2,
      client_name: clientName,
    })
    const response = await waitForWorkerResponse(worker, 'open_client')
    expect(response.request_id).toEqual(2)
    // Should handle response appropriately based on implementation
  },
)

workerTest(
  'should handle join_federation message',
  async ({ worker, clientName }) => {
    worker.postMessage({ type: 'init', request_id: 1 })
    await waitForWorkerResponse(worker, 'init_success')

    worker.postMessage({
      type: 'join_federation',
      request_id: 2,
      invite_code: TESTING_INVITE,
      client_name: clientName,
    })
    const response = await waitForWorkerResponse(worker, 'join_federation')
    expect(response.request_id).toEqual(2)
  },
)

workerTest(
  'should handle another join_federation test case',
  async ({ worker, clientName }) => {
    worker.postMessage({ type: 'init', request_id: 1 })
    await waitForWorkerResponse(worker, 'init_success')

    worker.postMessage({
      type: 'join_federation',
      request_id: 2,
      invite_code: TESTING_INVITE,
      client_name: clientName,
    })
    const response = await waitForWorkerResponse(worker, 'join_federation')
    expect(response.request_id).toEqual(2)
  },
)

workerTest('should handle unknown message type', async ({ worker }) => {
  worker.postMessage({ type: 'unknown', request_id: 2 })
  const response = await waitForWorkerResponse(worker, 'error')
  expect(response.error).toContain('unimplemented message type')
})
