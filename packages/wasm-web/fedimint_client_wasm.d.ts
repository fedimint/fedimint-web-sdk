/* tslint:disable */
/* eslint-disable */
export class IntoUnderlyingByteSource {
  private constructor();
  free(): void;
  start(controller: ReadableByteStreamController): void;
  pull(controller: ReadableByteStreamController): Promise<any>;
  cancel(): void;
  readonly type: string;
  readonly autoAllocateChunkSize: number;
}
export class IntoUnderlyingSink {
  private constructor();
  free(): void;
  write(chunk: any): Promise<any>;
  close(): Promise<any>;
  abort(reason: any): Promise<any>;
}
export class IntoUnderlyingSource {
  private constructor();
  free(): void;
  pull(controller: ReadableStreamDefaultController): Promise<any>;
  cancel(): void;
}
export class RpcHandle {
  private constructor();
  free(): void;
  cancel(): void;
}
export class WasmClient {
  private constructor();
  free(): void;
  /**
   * Open fedimint client with already joined federation.
   *
   * After you have joined a federation, you can reopen the fedimint client
   * with same client_name. Opening client with same name at same time is
   * not supported. You can close the current client by calling
   * `client.free()`. NOTE: The client will remain active until all the
   * running rpc calls have finished.
   */
  static open(client_name: string): Promise<WasmClient | undefined>;
  /**
   * Open a fedimint client by join a federation.
   */
  static join_federation(client_name: string, invite_code: string): Promise<WasmClient>;
  /**
   * Parse an invite code and extract its components without joining the
   * federation
   */
  static parse_invite_code(invite_code: string): string;
  /**
   * Parse a bolt11 invoice and extract its components
   * without joining the federation
   */
  static parse_bolt11_invoice(invoice_str: string): string;
  static preview_federation(invite_code: string): Promise<any>;
  /**
   * Call a fedimint client rpc the responses are returned using `cb`
   * callback. Each rpc call *can* return multiple responses by calling
   * `cb` multiple times. The returned RpcHandle can be used to cancel the
   * operation.
   */
  rpc(module: string, method: string, payload: string, cb: Function): RpcHandle;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasmclient_free: (a: number, b: number) => void;
  readonly __wbg_rpchandle_free: (a: number, b: number) => void;
  readonly rpchandle_cancel: (a: number) => void;
  readonly wasmclient_open: (a: number, b: number) => any;
  readonly wasmclient_join_federation: (a: number, b: number, c: number, d: number) => any;
  readonly wasmclient_parse_invite_code: (a: number, b: number) => [number, number, number, number];
  readonly wasmclient_parse_bolt11_invoice: (a: number, b: number) => [number, number, number, number];
  readonly wasmclient_preview_federation: (a: number, b: number) => any;
  readonly wasmclient_rpc: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: any) => number;
  readonly __wbg_intounderlyingsource_free: (a: number, b: number) => void;
  readonly intounderlyingsource_pull: (a: number, b: any) => any;
  readonly intounderlyingsource_cancel: (a: number) => void;
  readonly __wbg_intounderlyingbytesource_free: (a: number, b: number) => void;
  readonly intounderlyingbytesource_type: (a: number) => [number, number];
  readonly intounderlyingbytesource_autoAllocateChunkSize: (a: number) => number;
  readonly intounderlyingbytesource_start: (a: number, b: any) => void;
  readonly intounderlyingbytesource_pull: (a: number, b: any) => any;
  readonly intounderlyingbytesource_cancel: (a: number) => void;
  readonly __wbg_intounderlyingsink_free: (a: number, b: number) => void;
  readonly intounderlyingsink_write: (a: number, b: any) => any;
  readonly intounderlyingsink_close: (a: number) => any;
  readonly intounderlyingsink_abort: (a: number, b: any) => any;
  readonly ring_core_0_17_14__bn_mul_mont: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly rustsecp256k1_v0_10_0_context_create: (a: number) => number;
  readonly rustsecp256k1_v0_10_0_context_destroy: (a: number) => void;
  readonly rustsecp256k1_v0_10_0_default_illegal_callback_fn: (a: number, b: number) => void;
  readonly rustsecp256k1_v0_10_0_default_error_callback_fn: (a: number, b: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_5: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly closure2071_externref_shim: (a: number, b: number, c: any) => void;
  readonly closure8829_externref_shim: (a: number, b: number, c: any) => void;
  readonly _dyn_core__ops__function__Fn_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hb2702963d8fe80ce: (a: number, b: number) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hccebb8dc996bf447: (a: number, b: number) => void;
  readonly closure10853_externref_shim: (a: number, b: number, c: any) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h73e72502136e0af8: (a: number, b: number) => void;
  readonly closure10892_externref_shim: (a: number, b: number, c: any) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h7d210158df022ab1: (a: number, b: number) => void;
  readonly closure11474_externref_shim: (a: number, b: number, c: any) => void;
  readonly _dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hbd890e54ef7b5849: (a: number, b: number) => void;
  readonly closure11844_externref_shim: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
