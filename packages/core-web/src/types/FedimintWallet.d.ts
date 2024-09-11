const MODULE_KINDS = ['', 'ln', 'mint'] as const
type ModuleKind = (typeof MODULE_KINDS)[number]
type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[]

type JSONObject = Record<string, JSONValue>

type LightningGateway = {
  gateway_id: string
  api: string
  node_pub_key: string
  federation_index: number
  route_hints: RouteHint[]
  fees: FeeToAmount
}

type RouteHint = {
  // TODO: Define the structure of RouteHint
}

type FeeToAmount = {
  // TODO: Define the structure of FeeToAmount
}

type OutgoingLightningPayment = {
  payment_type: PayType
  contract_id: string
  fee: number
}

type PayType = {
  type: 'Internal' | 'Lightning'
  operation_id: string
}

type LnPayState =
  | 'Created'
  | 'Canceled'
  | { Funded: { block_height: number } }
  | { WaitingForRefund: { error_reason: string } }
  | 'AwaitingChange'
  | { Success: { preimage: string } }
  | { Refunded: { gateway_error: string } }
  | { UnexpectedError: { error_message: string } }

type LnReceiveState =
  | 'Created'
  | { WaitingForPayment: { invoice: string; timeout: number } }
  | { Canceled: { reason: string } }
  | 'Funded'
  | 'AwaitingFunds'
  | 'Claimed'

type CreateBolt11Response = {
  operation_id: string
  invoice: string
}

type StreamError = {
  error: string
  data: never
}

type StreamSuccess<T extends JSONValue> = {
  data: T
  error: never
}

type StreamResult<T extends JSONValue> = StreamSuccess<T> | StreamError

export {
  JSONValue,
  JSONObject,
  LightningGateway,
  RouteHint,
  FeeToAmount,
  OutgoingLightningPayment,
  PayType,
  LnPayState,
  LnReceiveState,
  CreateBolt11Response,
  StreamError,
  StreamSuccess,
  StreamResult,
  ModuleKind,
}
