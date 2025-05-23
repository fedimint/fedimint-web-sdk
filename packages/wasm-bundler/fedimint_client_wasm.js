import * as wasm from "./fedimint_client_wasm_bg.wasm";
export * from "./fedimint_client_wasm_bg.js";
import { __wbg_set_wasm } from "./fedimint_client_wasm_bg.js";
__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
