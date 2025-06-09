import type {
  GetOperationResponse,
  JSONValue,
  lastSeenRequest,
  Transactions,
} from '../types'
import { WorkerClient } from '../worker'

export class FederationService {
  constructor(private client: WorkerClient) {}

  async getConfig() {
    return await this.client.rpcSingle('', 'get_config', {})
  }

  async getFederationId() {
    return await this.client.rpcSingle<string>('', 'get_federation_id', {})
  }

  async getInviteCode(peer: number = 0) {
    return await this.client.rpcSingle<string | null>('', 'get_invite_code', {
      peer,
    })
  }

  async listOperations(
    limit?: number,
    last_seen?: lastSeenRequest,
  ): Promise<JSONValue[]> {
    return await this.client.rpcSingle<JSONValue[]>('', 'list_operations', {
      limit: limit ?? null,
      last_seen: last_seen ?? null,
    })
  }

  async getOperation(operationId: string) {
    return await this.client.rpcSingle<GetOperationResponse>(
      '',
      'get_operation',
      { operation_id: operationId },
    )
  }

  async listTransactions(
    limit?: number,
    last_seen?: lastSeenRequest,
  ): Promise<Transactions[]> {
    const operations = await this.listOperations(limit, last_seen)
    return operations
      .filter(
        (item): item is [any, any] => Array.isArray(item) && item.length === 2,
      )
      .filter(([_, op]: [any, any]) => {
        const moduleKind = op.operation_module_kind
        const variant = op.meta?.variant || {}
        return (
          (moduleKind === 'ln' && (variant.pay || variant.receive)) ||
          (moduleKind === 'mint' &&
            (variant.spend_o_o_b || variant.reissuance)) ||
          (moduleKind === 'wallet' && (variant.deposit || variant.withdraw))
        )
      })
      .map(([key, op]) => {
        const timeStamp = key.creation_time
          ? new Date(
              key.creation_time.secs_since_epoch * 1000 +
                key.creation_time.nanos_since_epoch / 1_000_000,
            ).toLocaleString()
          : '-'
        const operationId = key.operation_id
        const moduleKind = op.operation_module_kind
        let amount = 'N/A'
        let paymentType = 'unknown'
        let invoice = 'N/A'
        const meta = op.meta || {}
        const variant = meta.variant || {}

        if (moduleKind === 'ln') {
          paymentType = variant.pay
            ? 'send'
            : variant.receive
              ? 'receive'
              : 'unknown'
        } else if (moduleKind === 'mint') {
          paymentType = variant.spend_o_o_b
            ? 'spend_oob'
            : variant.reissuance
              ? 'reissue'
              : 'unknown'
        }

        let outcome: string
        if (!op.outcome?.outcome) {
          outcome = 'N/A'
        } else if (typeof op.outcome.outcome === 'object') {
          if ('success' in op.outcome.outcome) {
            outcome = 'success'
          } else if ('canceled' in op.outcome.outcome) {
            outcome = 'canceled'
          } else if ('WaitingForConfirmation' in op.outcome.outcome) {
            outcome = 'pending'
          } else if ('Confirmed' in op.outcome.outcome) {
            outcome = 'confirmed'
          } else if ('Claimed' in op.outcome.outcome) {
            outcome = 'claimed'
          } else {
            outcome = 'unknown'
          }
        } else {
          outcome = op.outcome.outcome
        }

        if (moduleKind === 'mint') {
          if (meta.amount && typeof meta.amount === 'number') {
            amount = meta.amount.toString()
          } else if (
            variant.spend_o_o_b?.requested_amount &&
            typeof variant.spend_o_o_b.requested_amount === 'number'
          ) {
            amount = variant.spend_o_o_b.requested_amount
          }
        } else if (moduleKind === 'ln') {
          invoice = variant.pay?.invoice || variant.receive?.invoice
        } else if (moduleKind === 'wallet') {
          if (
            variant.withdraw?.amount &&
            typeof variant.withdraw.amount === 'number'
          ) {
            amount = variant.withdraw.amount.toString()
          } else if (op.outcome && typeof op.outcome.outcome === 'object') {
            const outcome = op.outcome.outcome
            if (
              ('WaitingForConfirmation' in outcome &&
                outcome.WaitingForConfirmation.btc_deposited) ||
              ('Confirmed' in outcome && outcome.Confirmed.btc_deposited) ||
              ('Claimed' in outcome && outcome.Claimed.btc_deposited)
            ) {
              amount =
                outcome.WaitingForConfirmation?.btc_deposited ||
                outcome.Confirmed?.btc_deposited ||
                outcome.Claimed?.btc_deposited
            }
          }
          paymentType = variant.deposit ? 'deposit' : 'withdraw'
        }

        return {
          timeStamp,
          paymentType,
          type: moduleKind,
          amount,
          invoice,
          operationId,
          outcome,
          gateway:
            variant.pay?.gateway_id || variant.receive?.gateway_id || 'N/A',
        }
      })
  }
}
