import { Wallet } from '..'
import { logger } from '../utils/logger'

export const getRandomTestingId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(36)), (byte) =>
    byte.toString(36).padStart(2, '0'),
  )
    .join('')
    .substring(0, 36)

export const fundWallet = async (wallet: Wallet) => {
  const info = await getFaucetGatewayInfo(wallet)
  const invoice = await wallet.lightning.createInvoice(10_000, '', 1000, info)
  await Promise.all([
    payFaucetInvoice(invoice.invoice).then((result) => {
      logger.info('paid faucet invoice', result)
    }),
    wallet.lightning.waitForReceive(invoice.operation_id).then((res) => {
      logger.info('received', invoice.operation_id, res)
    }),
  ])
  logger.info('funded wallet', invoice.operation_id)
}

const getInviteCode = async () => {
  const res = await fetch(`${import.meta.env.FAUCET}/connect-string`)
  if (res.ok) {
    return await res.text()
  } else {
    throw new Error(`Failed to get invite code: ${await res.text()}`)
  }
}

export const TESTING_INVITE = await getInviteCode()

export const getFaucetGatewayApi = async (wallet: Wallet) => {
  const res = await fetch(`${import.meta.env.FAUCET}/gateway-api`)
  if (res.ok) {
    return await res.text()
  } else {
    throw new Error(`Failed to get gateway: ${await res.text()}`)
  }
}

export const getFaucetGatewayInfo = async (wallet: Wallet) => {
  await wallet.lightning.updateGatewayCache()
  const gateways = await wallet.lightning.listGateways()
  const api = await getFaucetGatewayApi(wallet)
  const gateway = gateways.find((g) => g.info.api === api)
  if (!gateway) {
    throw new Error(`Gateway not found: ${api}`)
  }
  return gateway.info
}

export const payFaucetInvoice = async (invoice: string) => {
  logger.info('paying faucet invoice', invoice)
  const res = await fetch(`${import.meta.env.FAUCET}/pay`, {
    method: 'POST',
    body: invoice,
  })
  if (res.ok) {
    return await res.text()
  } else {
    const result = await res.text()
    logger.info('failed to pay faucet invoice', result)
    throw new Error(`Failed to pay faucet invoice: ${result}`)
  }
}

export const createFaucetInvoice = async (amount: number) => {
  const res = await fetch(`${import.meta.env.FAUCET}/invoice`, {
    method: 'POST',
    body: amount.toString(),
  })
  if (res.ok) {
    return await res.text()
  } else {
    throw new Error(`Failed to generate faucet invoice: ${await res.text()}`)
  }
}

export const getRequestCounter = (wallet: Wallet) => {
  return wallet['_client']._getRequestCounter()
}
