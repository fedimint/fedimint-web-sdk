import { afterEach, describe, expect, it } from 'vitest'

/** The one part of the generated module this test uses. */
interface GeneratedBindings {
  converters: {
    FfiConverterTypeError__as_error: { lift(buffer: Uint8Array): Error }
  }
}

// The real generated module, not the `@fedimint/react-native-bindings` stub the other tests use:
// this test is about what the generated `Exception` class gives the ubrn runtime. A computed
// path keeps the file, which lives in another package, out of this package's type check.
const generatedPath = new URL(
  '../../../react-native-bindings/src/generated/fedimint_sdk.ts',
  import.meta.url,
).href

const DEBUG = 'Error { code: InvalidInput, reason: "not an invite code" }'

/**
 * Stands in for the JSI host just far enough to lift an `Exception` handle and call the trait
 * methods the crate exports. The text comes from here, so the Rust `Debug` output itself is
 * covered by `error.rs`; this covers the binding.
 */
function installNative() {
  const bytes = (s: string) => new TextEncoder().encode(s)
  ;(globalThis as { NativeFedimintSdk?: unknown }).NativeFedimintSdk = {
    ubrn_uniffi_internal_fn_method_error_ffi__bless_pointer: () => ({
      markDestroyed: () => {},
    }),
    ubrn_uniffi_fedimint_sdk_fn_clone_error: (handle: bigint) => handle,
    ubrn_uniffi_fedimint_sdk_fn_free_error: () => {},
    ubrn_uniffi_fedimint_sdk_fn_method_error_uniffi_trait_debug: () =>
      bytes(DEBUG),
    ubrn_uniffi_fedimint_sdk_fn_method_error_uniffi_trait_display: () =>
      bytes('InvalidInput: not an invite code'),
    rustbuffer_free: () => {},
  }
}

describe('a thrown Exception', () => {
  afterEach(() => {
    delete (globalThis as { NativeFedimintSdk?: unknown }).NativeFedimintSdk
  })

  it('names its code and reason in the error message', async () => {
    const generated = (await import(generatedPath)).default as GeneratedBindings
    installNative()
    // The generated `errorHandler` lifts the failed call's error buffer, an 8-byte handle,
    // through this converter, and throws what it returns.
    const errorBuffer = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1])
    const thrown =
      generated.converters.FfiConverterTypeError__as_error.lift(errorBuffer)
    expect(thrown).toBeInstanceOf(Error)
    expect(thrown.message).toContain('InvalidInput')
    expect(thrown.message).toContain('not an invite code')
  })
})
