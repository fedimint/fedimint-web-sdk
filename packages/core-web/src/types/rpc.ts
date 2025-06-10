import type { JSONValue } from './utils'

export type RpcRequestFull = {
  request_id: number
} & RpcRequest

export type RpcRequest =
  | {
      type: 'join_federation'
      invite_code: string
      client_name: string
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
      payload: any
    }
  | {
      type: 'cancel_rpc'
      cancel_request_id: number
    }
  | {
      type: 'parse_invite_code'
      invite_code: string
    }
  | {
      type: 'preview_federation'
      invite_code: string
    }
  | {
      type: 'parse_bolt11_invoice'
      invoice: string
    }

export type RpcResponseFull = {
  request_id: number
} & RpcResponse

export type RpcResponse =
  | {
      type: 'data'
      data: any
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
  | {
      type: 'log'
      message: string
      level: 'debug' | 'info' | 'warn' | 'error'
      data: any
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
