import { randomBytes } from 'crypto'
import * as secp256k1 from 'secp256k1'

interface KeyPair {
  secretKey: string
  publicKey: string
}

export const keyPair = (secretKey?: Buffer): KeyPair => {
  const privateKey: Buffer = secretKey
    ? validatePrivateKey(secretKey)
    : generatePrivateKey()

  const publicKey = secp256k1.publicKeyCreate(privateKey)

  return {
    secretKey: privateKey.toString('hex'),
    publicKey: Buffer.from(publicKey).toString('hex'),
  }
}

const validatePrivateKey = (key: Buffer): Buffer => {
  if (!secp256k1.privateKeyVerify(key)) {
    throw new Error('Invalid private key provided')
  }
  return key
}

const generatePrivateKey = (): Buffer => {
  let key: Buffer
  do {
    key = randomBytes(32)
  } while (!secp256k1.privateKeyVerify(key))
  return key
}
