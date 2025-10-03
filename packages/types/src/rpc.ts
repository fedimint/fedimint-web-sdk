import type { JSONValue } from './common'

export type RpcRequestFull = {
  request_id: number
} & RpcRequest

export type RpcRequest =
  | {
      type: 'set_mnemonic'
      words: string[]
    }
  | {
      type: 'generate_mnemonic'
    }
  | {
      type: 'get_mnemonic'
    }
  | {
      type: 'join_federation'
      invite_code: string
      client_name: string
      force_recover: boolean
    }
  | {
      type: 'open_client'
      client_name: string
    }
  | {
      type: 'close_client'
      client_name: string
    }
  | {
      type: 'client_rpc'
      client_name: string
      module: string
      method: string
      payload: JSONValue
    }
  | {
      type: 'parse_invite_code'
      invite_code: string
    }
  | {
      type: 'parse_bolt11_invoice'
      invoice: string
    }
  | {
      type: 'preview_federation'
      invite_code: string
    }
  | {
      type: 'cancel_rpc'
      cancel_request_id: number
    }

export type RpcResponse = {
  request_id: number
  kind: RpcResponseKind
}

export type RpcResponseKind =
  | {
      type: 'data'
      data: JSONValue
    }
  | {
      type: 'error'
      error: string
    }
  | {
      type: 'aborted'
    }
  | {
      type: 'end'
    }

const validRpcRequestTypes = [
  'set_mnemonic',
  'generate_mnemonic',
  'get_mnemonic',
  'join_federation',
  'open_client',
  'close_client',
  'client_rpc',
  'parse_invite_code',
  'parse_bolt11_invoice',
  'preview_federation',
  'cancel_rpc',
] as const

export type RpcRequestType = RpcRequest['type']

export function isValidRpcRequestType(type: string): type is RpcRequestType {
  return validRpcRequestTypes.includes(type as RpcRequestType)
}

export interface ParsedInviteCode extends Record<string, JSONValue> {
  federation_id: string
  url: string
}

export interface PreviewFederation extends Record<string, JSONValue> {
  config: string
  federation_id: string
}

export interface ParsedBolt11Invoice extends Record<string, JSONValue> {
  amount: number // in satoshis
  expiry: number
  memo: string
}
