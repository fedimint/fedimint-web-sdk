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
