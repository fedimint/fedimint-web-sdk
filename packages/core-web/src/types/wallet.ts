import { MSats, Duration, JSONValue, JSONObject } from './utils'

const MODULE_KINDS = ['', 'ln', 'mint', 'wallet'] as const
type ModuleKind = (typeof MODULE_KINDS)[number]

// TODO: Define the structure of FederationConfig
type FederationConfig = JSONObject

type GatewayInfo = {
  gateway_id: string
  api: string
  node_pub_key: string
  federation_index: number
  route_hints: RouteHint[]
  fees: FeeToAmount
}
type LightningGateway = {
  info: GatewayInfo
  vetted: boolean
  ttl: Duration
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
  fee: MSats
}

type PayType = { lightning: string } | { internal: string }

type LnPayState =
  | 'created'
  | 'canceled'
  | { funded: { block_height: number } }
  | { waiting_for_refund: { error_reason: string } }
  | 'awaiting_change'
  | { success: { preimage: string } }
  | { refunded: { gateway_error: string } }
  | { unexpected_error: { error_message: string } }

type LnReceiveState =
  | 'created'
  | { waiting_for_payment: { invoice: string; timeout: number } }
  | { canceled: { reason: string } }
  | 'funded'
  | 'awaiting_funds'
  | 'claimed'

type CreateBolt11Response = {
  operation_id: string
  invoice: string
}

type StreamError = {
  error: string
  data: never
  end: never
}

type StreamSuccess<T extends JSONValue> = {
  data: T
  error: never
  end: never
}

type StreamEnd = {
  end: string
  data: never
  error: never
}

type StreamResult<T extends JSONValue> =
  | StreamSuccess<T>
  | StreamError
  | StreamEnd

type CancelFunction = () => void

type ReissueExternalNotesState = 'Created' | 'Issuing' | 'Done'
// | { Failed: { error: string } }

type MintSpendNotesResponse = Array<string>

type SpendNotesState =
  | 'Created'
  | 'UserCanceledProcessing'
  | 'UserCanceledSuccess'
  | 'UserCanceledFailure'
  | 'Success'
  | 'Refunded'

type TxOutputSummary = {
  outpoint: {
    txid: string
    vout: number
  }
  amount: number
}

type WalletSummary = {
  spendable_utxos: TxOutputSummary[]
  unsigned_peg_out_txos: TxOutputSummary[]
  unsigned_change_utxos: TxOutputSummary[]
  unconfirmed_peg_out_txos: TxOutputSummary[]
  unconfirmed_change_utxos: TxOutputSummary[]
}

/** Keys are powers of 2 */
type NoteCountByDenomination = Record<number, number>

export {
  LightningGateway,
  FederationConfig,
  RouteHint,
  FeeToAmount,
  OutgoingLightningPayment,
  PayType,
  LnPayState,
  LnReceiveState,
  CreateBolt11Response,
  GatewayInfo,
  StreamError,
  StreamSuccess,
  StreamResult,
  ModuleKind,
  CancelFunction,
  ReissueExternalNotesState,
  MintSpendNotesResponse,
  SpendNotesState,
  WalletSummary,
  TxOutputSummary,
  NoteCountByDenomination,
}
