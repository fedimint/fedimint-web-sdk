/* tslint:disable */
/* eslint-disable */
/**
*/
export class RpcHandle {
  free(): void;
/**
*/
  cancel(): void;
}
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
* `cb` multiple times. The returned RpcHandle can be used to cancel the
* operation.
* @param {string} module
* @param {string} method
* @param {string} payload
* @param {Function} cb
* @returns {RpcHandle}
*/
  rpc(module: string, method: string, payload: string, cb: Function): RpcHandle;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasmclient_free: (a: number) => void;
  readonly __wbg_rpchandle_free: (a: number) => void;
  readonly rpchandle_cancel: (a: number) => void;
  readonly wasmclient_open: (a: number, b: number) => number;
  readonly wasmclient_join_federation: (a: number, b: number, c: number, d: number) => number;
  readonly wasmclient_rpc: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly rustsecp256k1_v0_10_0_context_create: (a: number) => number;
  readonly rustsecp256k1_v0_10_0_context_destroy: (a: number) => void;
  readonly rustsecp256k1_v0_10_0_default_illegal_callback_fn: (a: number, b: number) => void;
  readonly rustsecp256k1_v0_10_0_default_error_callback_fn: (a: number, b: number) => void;
  readonly ring_core_0_17_8_bn_mul_mont: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
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
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h74ee0aa9d6796e45: (a: number, b: number, c: number) => void;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h2e3953a051ad83d9: (a: number, b: number, c: number) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h85c0db7d59d21d18: (a: number, b: number) => void;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hb0eaa26544d2f671: (a: number, b: number, c: number) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h092019f160f24b1a: (a: number, b: number) => void;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hc9bf91ffddedbea9: (a: number, b: number, c: number) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hfc40bf9b854f8274: (a: number, b: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly wasm_bindgen__convert__closures__invoke2_mut__h10235f6a9066484b: (a: number, b: number, c: number, d: number) => void;
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
