#!/bin/sh

set -euo pipefail

exec devimint wasm-test-setup --exec "$@"