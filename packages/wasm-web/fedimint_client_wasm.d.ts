/* tslint:disable */
/* eslint-disable */
/**
*/
export class IntoUnderlyingByteSource {
  free(): void;
/**
* @param {ReadableByteStreamController} controller
*/
  start(controller: ReadableByteStreamController): void;
/**
* @param {ReadableByteStreamController} controller
* @returns {Promise<any>}
*/
  pull(controller: ReadableByteStreamController): Promise<any>;
/**
*/
  cancel(): void;
/**
*/
  readonly autoAllocateChunkSize: number;
/**
*/
  readonly type: string;
}
/**
*/
export class IntoUnderlyingSink {
  free(): void;
/**
* @param {any} chunk
* @returns {Promise<any>}
*/
  write(chunk: any): Promise<any>;
/**
* @returns {Promise<any>}
*/
  close(): Promise<any>;
/**
* @param {any} reason
* @returns {Promise<any>}
*/
  abort(reason: any): Promise<any>;
}
/**
*/
export class IntoUnderlyingSource {
  free(): void;
/**
* @param {ReadableStreamDefaultController} controller
* @returns {Promise<any>}
*/
  pull(controller: ReadableStreamDefaultController): Promise<any>;
/**
*/
  cancel(): void;
}
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
* Parse an invite code and extract its components without joining the
* federation
* @param {string} invite_code
* @returns {string}
*/
  static parse_invite_code(invite_code: string): string;
/**
* Parse a bolt11 invoice and extract its components
* without joining the federation
* @param {string} invoice_str
* @returns {string}
*/
  static parse_bolt11_invoice(invoice_str: string): string;
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
  readonly wasmclient_parse_invite_code: (a: number, b: number, c: number) => void;
  readonly wasmclient_parse_bolt11_invoice: (a: number, b: number, c: number) => void;
  readonly wasmclient_rpc: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly __wbg_intounderlyingbytesource_free: (a: number) => void;
  readonly intounderlyingbytesource_type: (a: number, b: number) => void;
  readonly intounderlyingbytesource_autoAllocateChunkSize: (a: number) => number;
  readonly intounderlyingbytesource_start: (a: number, b: number) => void;
  readonly intounderlyingbytesource_pull: (a: number, b: number) => number;
  readonly intounderlyingbytesource_cancel: (a: number) => void;
  readonly __wbg_intounderlyingsource_free: (a: number) => void;
  readonly intounderlyingsource_pull: (a: number, b: number) => number;
  readonly intounderlyingsource_cancel: (a: number) => void;
  readonly __wbg_intounderlyingsink_free: (a: number) => void;
  readonly intounderlyingsink_write: (a: number, b: number) => number;
  readonly intounderlyingsink_close: (a: number) => number;
  readonly intounderlyingsink_abort: (a: number, b: number) => number;
  readonly ring_core_0_17_8_bn_mul_mont: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rustsecp256k1_v0_10_0_context_create: (a: number) => number;
  readonly rustsecp256k1_v0_10_0_context_destroy: (a: number) => void;
  readonly rustsecp256k1_v0_10_0_default_illegal_callback_fn: (a: number, b: number) => void;
  readonly rustsecp256k1_v0_10_0_default_error_callback_fn: (a: number, b: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h2788518177513e34: (a: number, b: number, c: number) => void;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h35c6e8ead4941de0: (a: number, b: number, c: number) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h459f9978e9d878e7: (a: number, b: number) => void;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h17779c5ba415f925: (a: number, b: number, c: number) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h28809fcf55f02a9d: (a: number, b: number) => void;
  readonly _dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h5a9de1219525df92: (a: number, b: number, c: number) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h7a4562dc0b76959f: (a: number, b: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly wasm_bindgen__convert__closures__invoke2_mut__h40a29caa76e7bc97: (a: number, b: number, c: number, d: number) => void;
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
