type Alias<T> = T & {}
type Resolve<T> = T & unknown

type Seconds = Alias<number>
type Nanos = Alias<number>

type Duration = {
  nanos: Nanos
  secs: Seconds
}

type MSats = Alias<number>
type Sats = Alias<number>

type RpcFederationMaybeLoading =
  | string
  | number
  | boolean
  | null
  | { [key: string]: RpcFederationMaybeLoading }
  | RpcFederationMaybeLoading[]

type JSONObject = Record<string, RpcFederationMaybeLoading>

export {
  Alias,
  Resolve,
  Duration,
  MSats,
  Sats,
  RpcFederationMaybeLoading,
  JSONObject,
}
