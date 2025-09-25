import type { JSONValue } from './utils'

const TransportMessageTypes = [
  'init',
  'initialized',
  'rpc',
  'log',
  'open',
  'join',
  'error',
  'unsubscribe',
  'cleanup',
  'parseInviteCode',
  'parseBolt11Invoice',
  'previewFederation',
] as const

export type TransportMessageType = (typeof TransportMessageTypes)[number]

export type TransportRequest = {
  type: TransportMessageType
  requestId?: number
  payload?: JSONValue
}

export type TransportMessage = {
  type: TransportMessageType | string
  requestId?: number
} & Record<string, unknown>

export type TransportMessageHandler = (message: TransportMessage) => void

export type TransportErrorHandler = (error: unknown) => void

/**
 * Generic Transport interface for communicating with a specific
 * target of the FedimintClient. Can be Wasm, React Native, Node, etc.
 */
export interface Transport {
  postMessage(message: TransportRequest): void
  setMessageHandler(handler: TransportMessageHandler): void
  setErrorHandler(handler: TransportErrorHandler): void
}
