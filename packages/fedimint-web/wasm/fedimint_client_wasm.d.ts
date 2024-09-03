/* tslint:disable */
/* eslint-disable */
/**
*/
export class WasmClient {
  free(): void;
/**
* Open fedimint client with already joined federation.
*
* After you have joined a federation, you can reopen the fedimint client
* with same client_name. Opening client with same name at same time is
* not supported. You can close the current client by calling
* `client.free()`. NOTE: The client will remain active until all the
* running rpc calls have finished.
* @param {string} client_name
* @returns {Promise<WasmClient | undefined>}
*/
  static open(client_name: string): Promise<WasmClient | undefined>;
/**
* Open a fedimint client by join a federation.
* @param {string} client_name
* @param {string} invite_code
* @returns {Promise<WasmClient>}
*/
  static join_federation(client_name: string, invite_code: string): Promise<WasmClient>;
/**
* Call a fedimint client rpc the responses are returned using `cb`
* callback. Each rpc call *can* return multiple responses by calling
* `cb` multiple times. You should ignore the promise by this function
* because it has no significance.
* @param {string} module
* @param {string} method
* @param {string} payload
* @param {Function} cb
* @returns {Promise<void>}
*/
  rpc(module: string, method: string, payload: string, cb: Function): Promise<void>;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasmclient_free: (a: number) => void;
  readonly wasmclient_open: (a: number, b: number) => number;
  readonly wasmclient_join_federation: (a: number, b: number, c: number, d: number) => number;
  readonly wasmclient_rpc: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly ring_core_0_17_8_bn_mul_mont: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rustsecp256k1zkp_v0_8_0_default_illegal_callback_fn: (a: number, b: number) => void;
  readonly rustsecp256k1zkp_v0_8_0_default_error_callback_fn: (a: number, b: number) => void;
  readonly rustsecp256k1_v0_6_1_context_create: (a: number) => number;
  readonly rustsecp256k1_v0_6_1_context_destroy: (a: number) => void;
  readonly rustsecp256k1_v0_6_1_default_illegal_callback_fn: (a: number, b: number) => void;
  readonly rustsecp256k1_v0_6_1_default_error_callback_fn: (a: number, b: number) => void;
  readonly rustsecp256k1_v0_8_1_context_create: (a: number) => number;
  readonly rustsecp256k1_v0_8_1_context_destroy: (a: number) => void;
  readonly rustsecp256k1_v0_8_1_default_illegal_callback_fn: (a: number, b: number) => void;
  readonly rustsecp256k1_v0_8_1_default_error_callback_fn: (a: number, b: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hc084c31f1f28c9b8: (a: number, b: number, c: number) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h4dd814b8ece8133b: (a: number, b: number) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hc4ce6c5cec9839fc: (a: number, b: number) => void;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h9e6e02ca82bce998: (a: number, b: number, c: number) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h68e3ee1a8a347c24: (a: number, b: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly wasm_bindgen__convert__closures__invoke2_mut__h1ded20bdc1d87605: (a: number, b: number, c: number, d: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
