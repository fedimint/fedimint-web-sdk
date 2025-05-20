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
