let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_2.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => {
    wasm.__wbindgen_export_5.get(state.dtor)(state.a, state.b)
});

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_5.get(state.dtor)(a, state.b);
                CLOSURE_DTORS.unregister(state);
            } else {
                state.a = a;
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function makeClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        try {
            return f(state.a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_5.get(state.dtor)(state.a, state.b);
                state.a = 0;
                CLOSURE_DTORS.unregister(state);
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_2.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}
function __wbg_adapter_34(arg0, arg1, arg2) {
    wasm.closure2_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_37(arg0, arg1, arg2) {
    wasm.closure6244_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_46(arg0, arg1) {
    wasm._dyn_core__ops__function__Fn_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hd3bf70b599f3547d(arg0, arg1);
}

function __wbg_adapter_49(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__he3cc3f4965d04a65(arg0, arg1);
}

function __wbg_adapter_52(arg0, arg1, arg2) {
    wasm.closure7684_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_59(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h350d4791d89dc5e2(arg0, arg1);
}

function __wbg_adapter_62(arg0, arg1, arg2) {
    wasm.closure7708_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_65(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h56bfa92294ddbd06(arg0, arg1);
}

function __wbg_adapter_68(arg0, arg1, arg2) {
    wasm.closure8297_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_71(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hfd9c6b0ff54c4e4f(arg0, arg1);
}

function __wbg_adapter_403(arg0, arg1, arg2, arg3) {
    wasm.closure8647_externref_shim(arg0, arg1, arg2, arg3);
}

const __wbindgen_enum_BinaryType = ["blob", "arraybuffer"];

const __wbindgen_enum_IdbCursorDirection = ["next", "nextunique", "prev", "prevunique"];

const __wbindgen_enum_IdbTransactionMode = ["readonly", "readwrite", "versionchange", "readwriteflush", "cleanup"];

const __wbindgen_enum_RequestCredentials = ["omit", "same-origin", "include"];

const __wbindgen_enum_RequestMode = ["same-origin", "no-cors", "cors", "navigate"];

const IntoUnderlyingByteSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingbytesource_free(ptr >>> 0, 1));

export class IntoUnderlyingByteSource {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingByteSourceFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingbytesource_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get type() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.intounderlyingbytesource_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {number}
     */
    get autoAllocateChunkSize() {
        const ret = wasm.intounderlyingbytesource_autoAllocateChunkSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {ReadableByteStreamController} controller
     */
    start(controller) {
        wasm.intounderlyingbytesource_start(this.__wbg_ptr, controller);
    }
    /**
     * @param {ReadableByteStreamController} controller
     * @returns {Promise<any>}
     */
    pull(controller) {
        const ret = wasm.intounderlyingbytesource_pull(this.__wbg_ptr, controller);
        return ret;
    }
    cancel() {
        const ptr = this.__destroy_into_raw();
        wasm.intounderlyingbytesource_cancel(ptr);
    }
}

const IntoUnderlyingSinkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsink_free(ptr >>> 0, 1));

export class IntoUnderlyingSink {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingSinkFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingsink_free(ptr, 0);
    }
    /**
     * @param {any} chunk
     * @returns {Promise<any>}
     */
    write(chunk) {
        const ret = wasm.intounderlyingsink_write(this.__wbg_ptr, chunk);
        return ret;
    }
    /**
     * @returns {Promise<any>}
     */
    close() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.intounderlyingsink_close(ptr);
        return ret;
    }
    /**
     * @param {any} reason
     * @returns {Promise<any>}
     */
    abort(reason) {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.intounderlyingsink_abort(ptr, reason);
        return ret;
    }
}

const IntoUnderlyingSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsource_free(ptr >>> 0, 1));

export class IntoUnderlyingSource {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingSourceFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingsource_free(ptr, 0);
    }
    /**
     * @param {ReadableStreamDefaultController} controller
     * @returns {Promise<any>}
     */
    pull(controller) {
        const ret = wasm.intounderlyingsource_pull(this.__wbg_ptr, controller);
        return ret;
    }
    cancel() {
        const ptr = this.__destroy_into_raw();
        wasm.intounderlyingsource_cancel(ptr);
    }
}

const RpcHandleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rpchandle_free(ptr >>> 0, 1));

export class RpcHandle {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(RpcHandle.prototype);
        obj.__wbg_ptr = ptr;
        RpcHandleFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RpcHandleFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rpchandle_free(ptr, 0);
    }
    cancel() {
        wasm.rpchandle_cancel(this.__wbg_ptr);
    }
}

const WasmClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmclient_free(ptr >>> 0, 1));

export class WasmClient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmClient.prototype);
        obj.__wbg_ptr = ptr;
        WasmClientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmclient_free(ptr, 0);
    }
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
    static open(client_name) {
        const ptr0 = passStringToWasm0(client_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmclient_open(ptr0, len0);
        return ret;
    }
    /**
     * Open a fedimint client by join a federation.
     * @param {string} client_name
     * @param {string} invite_code
     * @returns {Promise<WasmClient>}
     */
    static join_federation(client_name, invite_code) {
        const ptr0 = passStringToWasm0(client_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(invite_code, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmclient_join_federation(ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * Parse an invite code and extract its components without joining the
     * federation
     * @param {string} invite_code
     * @returns {string}
     */
    static parse_invite_code(invite_code) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(invite_code, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.wasmclient_parse_invite_code(ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * Parse a bolt11 invoice and extract its components
     * without joining the federation
     * @param {string} invoice_str
     * @returns {string}
     */
    static parse_bolt11_invoice(invoice_str) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(invoice_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.wasmclient_parse_bolt11_invoice(ptr0, len0);
            var ptr2 = ret[0];
            var len2 = ret[1];
            if (ret[3]) {
                ptr2 = 0; len2 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
    /**
     * @param {string} invite_code
     * @returns {Promise<any>}
     */
    static preview_federation(invite_code) {
        const ptr0 = passStringToWasm0(invite_code, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmclient_preview_federation(ptr0, len0);
        return ret;
    }
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
    rpc(module, method, payload, cb) {
        const ptr0 = passStringToWasm0(module, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(method, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(payload, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.wasmclient_rpc(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, cb);
        return RpcHandle.__wrap(ret);
    }
}

export function __wbg_abort_775ef1d17fc65868(arg0) {
    arg0.abort();
};

export function __wbg_abort_99fc644e2c79c9fb() { return handleError(function (arg0) {
    arg0.abort();
}, arguments) };

export function __wbg_addEventListener_834c7f05e9c3b98b() { return handleError(function (arg0, arg1, arg2, arg3) {
    arg0.addEventListener(getStringFromWasm0(arg1, arg2), arg3);
}, arguments) };

export function __wbg_addEventListener_84ae3eac6e15480a() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    arg0.addEventListener(getStringFromWasm0(arg1, arg2), arg3, arg4);
}, arguments) };

export function __wbg_addEventListener_90e553fdce254421() { return handleError(function (arg0, arg1, arg2, arg3) {
    arg0.addEventListener(getStringFromWasm0(arg1, arg2), arg3);
}, arguments) };

export function __wbg_advance_b3ccc91b80962d79() { return handleError(function (arg0, arg1) {
    arg0.advance(arg1 >>> 0);
}, arguments) };

export function __wbg_append_8c7dd8d641a5f01b() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_arrayBuffer_d1b44c4390db422f() { return handleError(function (arg0) {
    const ret = arg0.arrayBuffer();
    return ret;
}, arguments) };

export function __wbg_body_0b8fd1fe671660df(arg0) {
    const ret = arg0.body;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_buffer_09165b52af8c5237(arg0) {
    const ret = arg0.buffer;
    return ret;
};

export function __wbg_buffer_609cc3eee51ed158(arg0) {
    const ret = arg0.buffer;
    return ret;
};

export function __wbg_byobRequest_77d9adf63337edfb(arg0) {
    const ret = arg0.byobRequest;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_byteLength_e674b853d9c77e1d(arg0) {
    const ret = arg0.byteLength;
    return ret;
};

export function __wbg_byteOffset_fd862df290ef848d(arg0) {
    const ret = arg0.byteOffset;
    return ret;
};

export function __wbg_call_672a4d21634d4a24() { return handleError(function (arg0, arg1) {
    const ret = arg0.call(arg1);
    return ret;
}, arguments) };

export function __wbg_call_7cccdd69e0791ae2() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.call(arg1, arg2);
    return ret;
}, arguments) };

export function __wbg_cancel_8a308660caa6cadf(arg0) {
    const ret = arg0.cancel();
    return ret;
};

export function __wbg_catch_a6e601879b2610e9(arg0, arg1) {
    const ret = arg0.catch(arg1);
    return ret;
};

export function __wbg_clearTimeout_5a54f8841c30079a(arg0) {
    const ret = clearTimeout(arg0);
    return ret;
};

export function __wbg_clearTimeout_710cb18754e44d88() { return handleError(function (arg0, arg1) {
    arg0.clearTimeout(arg1);
}, arguments) };

export function __wbg_clearTimeout_96804de0ab838f26(arg0) {
    const ret = clearTimeout(arg0);
    return ret;
};

export function __wbg_close_26fc2e6856d8567a(arg0) {
    arg0.close();
};

export function __wbg_close_2893b7d056a0627d() { return handleError(function (arg0) {
    arg0.close();
}, arguments) };

export function __wbg_close_304cc1fef3466669() { return handleError(function (arg0) {
    arg0.close();
}, arguments) };

export function __wbg_close_5ce03e29be453811() { return handleError(function (arg0) {
    arg0.close();
}, arguments) };

export function __wbg_close_e1253d480ed93ce3() { return handleError(function (arg0, arg1, arg2, arg3) {
    arg0.close(arg1, getStringFromWasm0(arg2, arg3));
}, arguments) };

export function __wbg_code_f4ec1e6e2e1b0417(arg0) {
    const ret = arg0.code;
    return ret;
};

export function __wbg_commit_ee33ba79d75a9134() { return handleError(function (arg0) {
    arg0.commit();
}, arguments) };

export function __wbg_continue_91e59787d3598bbb() { return handleError(function (arg0, arg1) {
    arg0.continue(arg1);
}, arguments) };

export function __wbg_continue_c46c11d3dbe1b030() { return handleError(function (arg0) {
    arg0.continue();
}, arguments) };

export function __wbg_createIndex_873ac48adc772309() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    const ret = arg0.createIndex(getStringFromWasm0(arg1, arg2), arg3, arg4);
    return ret;
}, arguments) };

export function __wbg_createIndex_fcfd513cf4581834() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = arg0.createIndex(getStringFromWasm0(arg1, arg2), arg3);
    return ret;
}, arguments) };

export function __wbg_createObjectStore_d2f9e1016f4d81b9() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = arg0.createObjectStore(getStringFromWasm0(arg1, arg2), arg3);
    return ret;
}, arguments) };

export function __wbg_crypto_ed58b8e10a292839(arg0) {
    const ret = arg0.crypto;
    return ret;
};

export function __wbg_data_432d9c3df2630942(arg0) {
    const ret = arg0.data;
    return ret;
};

export function __wbg_deleteIndex_e6717aa0e9691894() { return handleError(function (arg0, arg1, arg2) {
    arg0.deleteIndex(getStringFromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_deleteObjectStore_3f08ae00cd288224() { return handleError(function (arg0, arg1, arg2) {
    arg0.deleteObjectStore(getStringFromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_delete_200677093b4cf756() { return handleError(function (arg0, arg1) {
    const ret = arg0.delete(arg1);
    return ret;
}, arguments) };

export function __wbg_dispatchEvent_9e259d7c1d603dfb() { return handleError(function (arg0, arg1) {
    const ret = arg0.dispatchEvent(arg1);
    return ret;
}, arguments) };

export function __wbg_done_769e5ede4b31c67b(arg0) {
    const ret = arg0.done;
    return ret;
};

export function __wbg_done_9e178b857484d3df(arg0) {
    const ret = arg0.done;
    return ret;
};

export function __wbg_enqueue_bb16ba72f537dc9e() { return handleError(function (arg0, arg1) {
    arg0.enqueue(arg1);
}, arguments) };

export function __wbg_error_e9332df4e7a14612(arg0) {
    const ret = arg0.error;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_error_ff4ddaabdfc5dbb3() { return handleError(function (arg0) {
    const ret = arg0.error;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}, arguments) };

export function __wbg_fetch_509096533071c657(arg0, arg1) {
    const ret = arg0.fetch(arg1);
    return ret;
};

export function __wbg_fetch_b335d17f45a8b5a1(arg0) {
    const ret = fetch(arg0);
    return ret;
};

export function __wbg_fetch_f1856afdb49415d1(arg0) {
    const ret = fetch(arg0);
    return ret;
};

export function __wbg_getRandomValues_bcb4912f16000dc4() { return handleError(function (arg0, arg1) {
    arg0.getRandomValues(arg1);
}, arguments) };

export function __wbg_getReader_f5255c829ee10d2f() { return handleError(function (arg0) {
    const ret = arg0.getReader();
    return ret;
}, arguments) };

export function __wbg_getTime_46267b1c24877e30(arg0) {
    const ret = arg0.getTime();
    return ret;
};

export function __wbg_get_4f73335ab78445db(arg0, arg1, arg2) {
    const ret = arg1[arg2 >>> 0];
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_get_67b2ba62fc30de12() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(arg0, arg1);
    return ret;
}, arguments) };

export function __wbg_get_b9b93047fe3cf45b(arg0, arg1) {
    const ret = arg0[arg1 >>> 0];
    return ret;
};

export function __wbg_has_a5ea9117f258a0ec() { return handleError(function (arg0, arg1) {
    const ret = Reflect.has(arg0, arg1);
    return ret;
}, arguments) };

export function __wbg_headers_9cb51cfd2ac780a4(arg0) {
    const ret = arg0.headers;
    return ret;
};

export function __wbg_indexNames_0ed82a19d7d88aa3(arg0) {
    const ret = arg0.indexNames;
    return ret;
};

export function __wbg_index_e00ca5fff206ee3e() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.index(getStringFromWasm0(arg1, arg2));
    return ret;
}, arguments) };

export function __wbg_instanceof_ArrayBuffer_e14585432e3737fc(arg0) {
    let result;
    try {
        result = arg0 instanceof ArrayBuffer;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_Blob_ca721ef3bdab15d1(arg0) {
    let result;
    try {
        result = arg0 instanceof Blob;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_Error_4d54113b22d20306(arg0) {
    let result;
    try {
        result = arg0 instanceof Error;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_IdbCursorWithValue_18f39d69ed298f6f(arg0) {
    let result;
    try {
        result = arg0 instanceof IDBCursorWithValue;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_IdbDatabase_a3ef009ca00059f9(arg0) {
    let result;
    try {
        result = arg0 instanceof IDBDatabase;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_IdbFactory_12eaba3366f4302f(arg0) {
    let result;
    try {
        result = arg0 instanceof IDBFactory;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_IdbOpenDbRequest_a3416e156c9db893(arg0) {
    let result;
    try {
        result = arg0 instanceof IDBOpenDBRequest;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_IdbRequest_4813c3f207666aa4(arg0) {
    let result;
    try {
        result = arg0 instanceof IDBRequest;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_IdbTransaction_746ea660d347650d(arg0) {
    let result;
    try {
        result = arg0 instanceof IDBTransaction;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_Response_f2cc20d9f7dfd644(arg0) {
    let result;
    try {
        result = arg0 instanceof Response;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_Uint8Array_17156bcf118086a9(arg0) {
    let result;
    try {
        result = arg0 instanceof Uint8Array;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_isArray_a1eab7e0d067391b(arg0) {
    const ret = Array.isArray(arg0);
    return ret;
};

export function __wbg_iterator_9a24c88df860dc65() {
    const ret = Symbol.iterator;
    return ret;
};

export function __wbg_keyPath_443ecf3f74202169() { return handleError(function (arg0) {
    const ret = arg0.keyPath;
    return ret;
}, arguments) };

export function __wbg_key_29fefecef430db96() { return handleError(function (arg0) {
    const ret = arg0.key;
    return ret;
}, arguments) };

export function __wbg_length_52b6c4580c5ec934(arg0) {
    const ret = arg0.length;
    return ret;
};

export function __wbg_length_a446193dc22c12f8(arg0) {
    const ret = arg0.length;
    return ret;
};

export function __wbg_length_e2d2a49132c1b256(arg0) {
    const ret = arg0.length;
    return ret;
};

export function __wbg_message_97a2af9b89d693a3(arg0) {
    const ret = arg0.message;
    return ret;
};

export function __wbg_msCrypto_0a36e2ec3a343d26(arg0) {
    const ret = arg0.msCrypto;
    return ret;
};

export function __wbg_multiEntry_c146ebd38a5de9ea(arg0) {
    const ret = arg0.multiEntry;
    return ret;
};

export function __wbg_name_0b327d569f00ebee(arg0) {
    const ret = arg0.name;
    return ret;
};

export function __wbg_new0_f788a2397c7ca929() {
    const ret = new Date();
    return ret;
};

export function __wbg_new_018dcc2d6c8c2f6a() { return handleError(function () {
    const ret = new Headers();
    return ret;
}, arguments) };

export function __wbg_new_23a2665fac83c611(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_403(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        const ret = new Promise(cb0);
        return ret;
    } finally {
        state0.a = state0.b = 0;
    }
};

export function __wbg_new_405e22f390576ce2() {
    const ret = new Object();
    return ret;
};

export function __wbg_new_78feb108b6472713() {
    const ret = new Array();
    return ret;
};

export function __wbg_new_92c54fc74574ef55() { return handleError(function (arg0, arg1) {
    const ret = new WebSocket(getStringFromWasm0(arg0, arg1));
    return ret;
}, arguments) };

export function __wbg_new_a12002a7f91c75be(arg0) {
    const ret = new Uint8Array(arg0);
    return ret;
};

export function __wbg_new_c68d7209be747379(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return ret;
};

export function __wbg_new_e25e5aab09ff45db() { return handleError(function () {
    const ret = new AbortController();
    return ret;
}, arguments) };

export function __wbg_newnoargs_105ed471475aaf50(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return ret;
};

export function __wbg_newwithbyteoffsetandlength_d97e637ebe145a9a(arg0, arg1, arg2) {
    const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
    return ret;
};

export function __wbg_newwitheventinitdict_502dbfa1b3d2fcbc() { return handleError(function (arg0, arg1, arg2) {
    const ret = new CloseEvent(getStringFromWasm0(arg0, arg1), arg2);
    return ret;
}, arguments) };

export function __wbg_newwithlength_a381634e90c276d4(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return ret;
};

export function __wbg_newwithstrandinit_06c535e0a867c635() { return handleError(function (arg0, arg1, arg2) {
    const ret = new Request(getStringFromWasm0(arg0, arg1), arg2);
    return ret;
}, arguments) };

export function __wbg_next_25feadfc0913fea9(arg0) {
    const ret = arg0.next;
    return ret;
};

export function __wbg_next_6574e1a8a62d1055() { return handleError(function (arg0) {
    const ret = arg0.next();
    return ret;
}, arguments) };

export function __wbg_node_02999533c4ea02e3(arg0) {
    const ret = arg0.node;
    return ret;
};

export function __wbg_now_2c95c9de01293173(arg0) {
    const ret = arg0.now();
    return ret;
};

export function __wbg_now_807e54c39636c349() {
    const ret = Date.now();
    return ret;
};

export function __wbg_objectStoreNames_9bb1ab04a7012aaf(arg0) {
    const ret = arg0.objectStoreNames;
    return ret;
};

export function __wbg_objectStore_21878d46d25b64b6() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.objectStore(getStringFromWasm0(arg1, arg2));
    return ret;
}, arguments) };

export function __wbg_openCursor_238e247d18bde2cd() { return handleError(function (arg0) {
    const ret = arg0.openCursor();
    return ret;
}, arguments) };

export function __wbg_openCursor_6fd4dab51810d238() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.openCursor(arg1, __wbindgen_enum_IdbCursorDirection[arg2]);
    return ret;
}, arguments) };

export function __wbg_openCursor_f4b061aa6d804b93() { return handleError(function (arg0, arg1) {
    const ret = arg0.openCursor(arg1);
    return ret;
}, arguments) };

export function __wbg_open_88b1390d99a7c691() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.open(getStringFromWasm0(arg1, arg2));
    return ret;
}, arguments) };

export function __wbg_open_e0c0b2993eb596e1() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = arg0.open(getStringFromWasm0(arg1, arg2), arg3 >>> 0);
    return ret;
}, arguments) };

export function __wbg_performance_7a3ffd0b17f663ad(arg0) {
    const ret = arg0.performance;
    return ret;
};

export function __wbg_process_5c1d670bc53614b8(arg0) {
    const ret = arg0.process;
    return ret;
};

export function __wbg_push_737cfc8c1432c2c6(arg0, arg1) {
    const ret = arg0.push(arg1);
    return ret;
};

export function __wbg_put_066faa31a6a88f5b() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.put(arg1, arg2);
    return ret;
}, arguments) };

export function __wbg_put_9ef5363941008835() { return handleError(function (arg0, arg1) {
    const ret = arg0.put(arg1);
    return ret;
}, arguments) };

export function __wbg_queueMicrotask_97d92b4fcc8a61c5(arg0) {
    queueMicrotask(arg0);
};

export function __wbg_queueMicrotask_d3219def82552485(arg0) {
    const ret = arg0.queueMicrotask;
    return ret;
};

export function __wbg_randomFillSync_ab2cfe79ebbf2740() { return handleError(function (arg0, arg1) {
    arg0.randomFillSync(arg1);
}, arguments) };

export function __wbg_read_a2434af1186cb56c(arg0) {
    const ret = arg0.read();
    return ret;
};

export function __wbg_readyState_7ef6e63c349899ed(arg0) {
    const ret = arg0.readyState;
    return ret;
};

export function __wbg_reason_49f1cede8bcf23dd(arg0, arg1) {
    const ret = arg1.reason;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_releaseLock_091899af97991d2e(arg0) {
    arg0.releaseLock();
};

export function __wbg_removeEventListener_056dfe8c3d6c58f9() { return handleError(function (arg0, arg1, arg2, arg3) {
    arg0.removeEventListener(getStringFromWasm0(arg1, arg2), arg3);
}, arguments) };

export function __wbg_removeEventListener_709135c542708608() { return handleError(function (arg0, arg1, arg2, arg3) {
    arg0.removeEventListener(getStringFromWasm0(arg1, arg2), arg3);
}, arguments) };

export function __wbg_request_695d684a1f4bb96e(arg0) {
    const ret = arg0.request;
    return ret;
};

export function __wbg_require_79b1e9274cde3c87() { return handleError(function () {
    const ret = module.require;
    return ret;
}, arguments) };

export function __wbg_resolve_4851785c9c5f573d(arg0) {
    const ret = Promise.resolve(arg0);
    return ret;
};

export function __wbg_respond_1f279fa9f8edcb1c() { return handleError(function (arg0, arg1) {
    arg0.respond(arg1 >>> 0);
}, arguments) };

export function __wbg_result_f29afabdf2c05826() { return handleError(function (arg0) {
    const ret = arg0.result;
    return ret;
}, arguments) };

export function __wbg_send_0293179ba074ffb4() { return handleError(function (arg0, arg1, arg2) {
    arg0.send(getStringFromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_send_fc0c204e8a1757f4() { return handleError(function (arg0, arg1, arg2) {
    arg0.send(getArrayU8FromWasm0(arg1, arg2));
}, arguments) };

export function __wbg_setTimeout_592d289a39056aa2() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.setTimeout(arg1, arg2);
    return ret;
}, arguments) };

export function __wbg_setTimeout_db2dbaeefb6f39c7() { return handleError(function (arg0, arg1) {
    const ret = setTimeout(arg0, arg1);
    return ret;
}, arguments) };

export function __wbg_setTimeout_eefe7f4c234b0c6b() { return handleError(function (arg0, arg1) {
    const ret = setTimeout(arg0, arg1);
    return ret;
}, arguments) };

export function __wbg_set_65595bdd868b3009(arg0, arg1, arg2) {
    arg0.set(arg1, arg2 >>> 0);
};

export function __wbg_setautoincrement_8b4327709e9ee7d9(arg0, arg1) {
    arg0.autoIncrement = arg1 !== 0;
};

export function __wbg_setbinaryType_92fa1ffd873b327c(arg0, arg1) {
    arg0.binaryType = __wbindgen_enum_BinaryType[arg1];
};

export function __wbg_setbody_5923b78a95eedf29(arg0, arg1) {
    arg0.body = arg1;
};

export function __wbg_setcode_156060465a2f8f79(arg0, arg1) {
    arg0.code = arg1;
};

export function __wbg_setcredentials_c3a22f1cd105a2c6(arg0, arg1) {
    arg0.credentials = __wbindgen_enum_RequestCredentials[arg1];
};

export function __wbg_sethandleevent_8454ae22cde5c602(arg0, arg1) {
    arg0.handleEvent = arg1;
};

export function __wbg_setheaders_834c0bdb6a8949ad(arg0, arg1) {
    arg0.headers = arg1;
};

export function __wbg_setkeypath_691179e313c26ae1(arg0, arg1) {
    arg0.keyPath = arg1;
};

export function __wbg_setmethod_3c5280fe5d890842(arg0, arg1, arg2) {
    arg0.method = getStringFromWasm0(arg1, arg2);
};

export function __wbg_setmode_5dc300b865044b65(arg0, arg1) {
    arg0.mode = __wbindgen_enum_RequestMode[arg1];
};

export function __wbg_setmultientry_4c4eee871f29837a(arg0, arg1) {
    arg0.multiEntry = arg1 !== 0;
};

export function __wbg_setonabort_3bf4db6614fa98e9(arg0, arg1) {
    arg0.onabort = arg1;
};

export function __wbg_setonce_0cb80aea26303a35(arg0, arg1) {
    arg0.once = arg1 !== 0;
};

export function __wbg_setonclose_14fc475a49d488fc(arg0, arg1) {
    arg0.onclose = arg1;
};

export function __wbg_setoncomplete_4d19df0dadb7c4d4(arg0, arg1) {
    arg0.oncomplete = arg1;
};

export function __wbg_setonerror_8639efe354b947cd(arg0, arg1) {
    arg0.onerror = arg1;
};

export function __wbg_setonerror_b0d9d723b8fddbbb(arg0, arg1) {
    arg0.onerror = arg1;
};

export function __wbg_setonerror_d7e3056cc6e56085(arg0, arg1) {
    arg0.onerror = arg1;
};

export function __wbg_setonmessage_6eccab530a8fb4c7(arg0, arg1) {
    arg0.onmessage = arg1;
};

export function __wbg_setonopen_2da654e1f39745d5(arg0, arg1) {
    arg0.onopen = arg1;
};

export function __wbg_setonsuccess_afa464ee777a396d(arg0, arg1) {
    arg0.onsuccess = arg1;
};

export function __wbg_setonupgradeneeded_fcf7ce4f2eb0cb5f(arg0, arg1) {
    arg0.onupgradeneeded = arg1;
};

export function __wbg_setonversionchange_6ee07fa49ee1e3a5(arg0, arg1) {
    arg0.onversionchange = arg1;
};

export function __wbg_setreason_d29ac0402eeeb81a(arg0, arg1, arg2) {
    arg0.reason = getStringFromWasm0(arg1, arg2);
};

export function __wbg_setsignal_75b21ef3a81de905(arg0, arg1) {
    arg0.signal = arg1;
};

export function __wbg_setunique_dd24c422aa05df89(arg0, arg1) {
    arg0.unique = arg1 !== 0;
};

export function __wbg_signal_aaf9ad74119f20a4(arg0) {
    const ret = arg0.signal;
    return ret;
};

export function __wbg_static_accessor_GLOBAL_88a902d13a557d07() {
    const ret = typeof global === 'undefined' ? null : global;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0() {
    const ret = typeof globalThis === 'undefined' ? null : globalThis;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_static_accessor_SELF_37c5d418e4bf5819() {
    const ret = typeof self === 'undefined' ? null : self;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_static_accessor_WINDOW_5de37043a91a9c40() {
    const ret = typeof window === 'undefined' ? null : window;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_status_f6360336ca686bf0(arg0) {
    const ret = arg0.status;
    return ret;
};

export function __wbg_stringify_f7ed6987935b4a24() { return handleError(function (arg0) {
    const ret = JSON.stringify(arg0);
    return ret;
}, arguments) };

export function __wbg_subarray_aa9065fa9dc5df96(arg0, arg1, arg2) {
    const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
    return ret;
};

export function __wbg_target_0a62d9d79a2a1ede(arg0) {
    const ret = arg0.target;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_text_7805bea50de2af49() { return handleError(function (arg0) {
    const ret = arg0.text();
    return ret;
}, arguments) };

export function __wbg_then_44b73946d2fb3e7d(arg0, arg1) {
    const ret = arg0.then(arg1);
    return ret;
};

export function __wbg_then_48b406749878a531(arg0, arg1, arg2) {
    const ret = arg0.then(arg1, arg2);
    return ret;
};

export function __wbg_toString_c813bbd34d063839(arg0) {
    const ret = arg0.toString();
    return ret;
};

export function __wbg_transaction_d6d07c3c9963c49e() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.transaction(arg1, __wbindgen_enum_IdbTransactionMode[arg2]);
    return ret;
}, arguments) };

export function __wbg_transaction_e713aa7b07ccaedd(arg0) {
    const ret = arg0.transaction;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_unique_23ddfed89bddb31d(arg0) {
    const ret = arg0.unique;
    return ret;
};

export function __wbg_url_ae10c34ca209681d(arg0, arg1) {
    const ret = arg1.url;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_value_68c4e9a54bb7fd5e() { return handleError(function (arg0) {
    const ret = arg0.value;
    return ret;
}, arguments) };

export function __wbg_value_cd1ffa7b1ab794f1(arg0) {
    const ret = arg0.value;
    return ret;
};

export function __wbg_value_e5170ceef06c5805(arg0) {
    const ret = arg0.value;
    return ret;
};

export function __wbg_versions_c71aa1626a93e0a1(arg0) {
    const ret = arg0.versions;
    return ret;
};

export function __wbg_view_fd8a56e8983f448d(arg0) {
    const ret = arg0.view;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_wasClean_605b4fd66d44354a(arg0) {
    const ret = arg0.wasClean;
    return ret;
};

export function __wbg_wasmclient_new(arg0) {
    const ret = WasmClient.__wrap(arg0);
    return ret;
};

export function __wbindgen_boolean_get(arg0) {
    const v = arg0;
    const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
    return ret;
};

export function __wbindgen_cb_drop(arg0) {
    const obj = arg0.original;
    if (obj.cnt-- == 1) {
        obj.a = 0;
        return true;
    }
    const ret = false;
    return ret;
};

export function __wbindgen_closure_wrapper25510(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 6245, __wbg_adapter_37);
    return ret;
};

export function __wbindgen_closure_wrapper25512(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 6245, __wbg_adapter_37);
    return ret;
};

export function __wbindgen_closure_wrapper25514(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 6245, __wbg_adapter_37);
    return ret;
};

export function __wbindgen_closure_wrapper25516(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 6245, __wbg_adapter_37);
    return ret;
};

export function __wbindgen_closure_wrapper28047(arg0, arg1, arg2) {
    const ret = makeClosure(arg0, arg1, 6530, __wbg_adapter_46);
    return ret;
};

export function __wbindgen_closure_wrapper34146(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 7640, __wbg_adapter_49);
    return ret;
};

export function __wbindgen_closure_wrapper34356(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 7683, __wbg_adapter_52);
    return ret;
};

export function __wbindgen_closure_wrapper34358(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 7683, __wbg_adapter_52);
    return ret;
};

export function __wbindgen_closure_wrapper34360(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 7683, __wbg_adapter_52);
    return ret;
};

export function __wbindgen_closure_wrapper34362(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 7683, __wbg_adapter_59);
    return ret;
};

export function __wbindgen_closure_wrapper34559(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 7709, __wbg_adapter_62);
    return ret;
};

export function __wbindgen_closure_wrapper38809(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 8231, __wbg_adapter_65);
    return ret;
};

export function __wbindgen_closure_wrapper39563(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 8298, __wbg_adapter_68);
    return ret;
};

export function __wbindgen_closure_wrapper39636(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 8315, __wbg_adapter_71);
    return ret;
};

export function __wbindgen_closure_wrapper578(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 3, __wbg_adapter_34);
    return ret;
};

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(arg1);
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbindgen_error_new(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return ret;
};

export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_export_2;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
    ;
};

export function __wbindgen_is_function(arg0) {
    const ret = typeof(arg0) === 'function';
    return ret;
};

export function __wbindgen_is_null(arg0) {
    const ret = arg0 === null;
    return ret;
};

export function __wbindgen_is_object(arg0) {
    const val = arg0;
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbindgen_is_string(arg0) {
    const ret = typeof(arg0) === 'string';
    return ret;
};

export function __wbindgen_is_undefined(arg0) {
    const ret = arg0 === undefined;
    return ret;
};

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return ret;
};

export function __wbindgen_string_get(arg0, arg1) {
    const obj = arg1;
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return ret;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

