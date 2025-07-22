import { Wallet } from '..'

export const TESTING_INVITE =
  'fed11qgqrsdnhwden5te0v9cxjtt4dekxzamxw4kz6mmjvvkhydted9ukg6r9xfsnx7th0fhn26tf093juamwv4u8gtnpwpcz7qqpyz0e327ua8geceutfrcaezwt22mk6s2rdy09kg72jrcmncng2gn0kp2m5sk'

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
    payFaucetInvoice(invoice.invoice),
    wallet.lightning.waitForReceive(invoice.operation_id),
  ])
}

export const getInviteCode = async () => {
  const res = await fetch(`${import.meta.env.FAUCET}/connect-string`)
  if (res.ok) {
    return await res.text()
  } else {
    throw new Error(`Failed to get invite code: ${await res.text()}`)
  }
}

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
  console.error('gateways', gateways)
  if (!gateway) {
    throw new Error(`Gateway not found: ${api}`)
  }
  return gateway.info
}

export const payFaucetInvoice = async (invoice: string) => {
  const res = await fetch(`${import.meta.env.FAUCET}/pay`, {
    method: 'POST',
    body: invoice,
  })
  if (res.ok) {
    return await res.text()
  } else {
    throw new Error(`Failed to pay faucet invoice: ${await res.text()}`)
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
