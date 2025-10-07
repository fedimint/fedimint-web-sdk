export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[]

export const TRANSPORT_MESSAGE_TYPES = [
  'init',
  'client_rpc',
  'open_client',
  'cancel_rpc',
  'join_federation',
  'error',
  'cleanup',
  'generate_mnemonic',
  'get_mnemonic',
  'set_mnemonic',
  'parse_invite_code',
  'parse_bolt11_invoice',
  'preview_federation',
] as const

export type TransportMessageType = (typeof TRANSPORT_MESSAGE_TYPES)[number]

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
export abstract class Transport {
  protected messageHandler: TransportMessageHandler = () => {}
  protected errorHandler: TransportErrorHandler = () => {}
  abstract logger: TransportLogger
  abstract postMessage(message: TransportRequest): void
  setMessageHandler(handler: TransportMessageHandler): void {
    this.messageHandler = handler
  }
  setErrorHandler(handler: TransportErrorHandler): void {
    this.errorHandler = handler
  }
}

/**
 * Generic logger interface based on console-style logging.
 */
export type TransportLogger = {
  debug(message: string, ...args: any[]): void
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
}
