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
