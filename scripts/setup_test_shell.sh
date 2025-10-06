#!/usr/bin/env bash

set -euo pipefail

# Event though it would be better, do not use `exec` for this,
# as pnpm seems to be swallowing non-zero error codes if it
# is run like this, but only when this whole script is called from
# another pnpm instance.
devimint wasm-test-setup --exec "$@"
