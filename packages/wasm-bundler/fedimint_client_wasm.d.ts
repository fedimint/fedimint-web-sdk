/* tslint:disable */
/* eslint-disable */
/**
 * Parse an invite code and extract its components without joining the
 * federation
 */
export function parse_invite_code(invite_code: string): string;
/**
 * Parse a bolt11 invoice and extract its components
 * without joining the federation
 */
export function parse_bolt11_invoice(invoice_str: string): string;
export function preview_federation(invite_code: string): Promise<any>;
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
export class RpcHandler {
  free(): void;
  constructor();
  rpc(request: string, cb: Function): void;
}
