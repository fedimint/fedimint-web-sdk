#!/usr/bin/env bash
#
# Hides every global symbol of a static library of rust/fedimint-sdk except the FFI functions
# (`uniffi_*`, `ffi_*`) that the bindings call.
#
#   scripts/hide-ios-symbols.sh <in.a> [<out.a>]
#
# Without <out.a> the library is replaced. A fat library is done one architecture at a time.
#
# An app exports every global symbol it links, so an app that links the library carries the names
# of all the Rust functions it uses in its export trie: 3.8 MB of the demo's 26 MB release build
# with Rust 1.95, and 9.7 MB of 32 MB with Rust 1.99, whose symbol mangling makes longer names.
# Hidden symbols still link between the library's objects, so nothing else about the app changes.
#
# Each object goes through `ld -r -keep_private_externs` on its own, which keeps the final link's
# dead stripping symbol by symbol; one merged object would keep all the code. Objects compiled
# without MH_SUBSECTIONS_VIA_SYMBOLS, aws-lc's hand-written assembly, are copied as they are:
# `ld -r` breaks their local labels, and they export only short C names.
#
# macOS with Xcode only.
set -euo pipefail

die() {
    echo "$*" >&2
    exit 1
}

(($# == 1 || $# == 2)) || die "usage: $0 <in.a> [<out.a>]"
IN="$1"
OUT="${2:-$1}"
[[ -f "$IN" ]] || die "no library at $IN"
command -v xcrun >/dev/null || die "xcrun not found; this needs macOS with Xcode"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
printf '_uniffi_*\n_ffi_*\n' >"$TMP/ffi-symbols.txt"

# The symbols a library defines and exports, one per line. `--no-llvm-bc` reads the symbol table
# rather than the embedded bitcode, which Xcode's LLVM may be too old for.
exported() {
    xcrun nm -m --no-llvm-bc "$1" >"$TMP/nm.out" 2>"$TMP/nm.err" ||
        die "nm failed on $1: $(grep -v 'no symbols' "$TMP/nm.err" | head -3)"
    awk '/ external / && !/private external/ && !/\(undefined\)/ { print $NF }' "$TMP/nm.out" |
        sort -u
}

read -r -a archs <<<"$(xcrun lipo -archs "$IN")"
((${#archs[@]} > 0)) || die "lipo found no architecture in $IN"

thin=()
for arch in "${archs[@]}"; do
    dir="$TMP/$arch"
    mkdir -p "$dir/objects" "$dir/hidden"
    if ((${#archs[@]} > 1)); then
        xcrun lipo "$IN" -thin "$arch" -output "$dir/in.a"
    else
        cp "$IN" "$dir/in.a"
    fi
    (cd "$dir/objects" && xcrun ar x "$dir/in.a")
    rm -f "$dir/objects/__.SYMDEF"*
    # `ar x` writes members of the same name over each other, which would lose code.
    members="$(xcrun ar t "$dir/in.a" | grep -vc '^__\.SYMDEF')"
    extracted="$(find "$dir/objects" -type f | wc -l | tr -d ' ')"
    [[ "$members" == "$extracted" ]] ||
        die "$IN ($arch) has $members members but only $extracted distinct names"

    # Not `xargs -I`: BSD xargs cuts what it substitutes at 255 bytes.
    # shellcheck disable=SC2016 # The inner sh expands them.
    find "$dir/objects" -type f -print0 | xargs -0 -n 1 -P "$(sysctl -n hw.ncpu)" sh -c '
        if xcrun otool -hv "$4" | grep -q SUBSECTIONS_VIA_SYMBOLS; then
            xcrun ld -r -keep_private_externs -arch "$1" -exported_symbols_list "$2" "$4" \
                -o "$3/${4##*/}"
        else
            cp "$4" "$3/"
        fi' _ "$arch" "$TMP/ffi-symbols.txt" "$dir/hidden"

    find "$dir/hidden" -type f | sort >"$dir/objects.txt"
    xcrun libtool -static -no_warning_for_no_symbols -filelist "$dir/objects.txt" -o "$dir/out.a"
    thin+=("$dir/out.a")
done

if ((${#thin[@]} > 1)); then
    xcrun lipo -create "${thin[@]}" -output "$TMP/out.a"
else
    mv "${thin[0]}" "$TMP/out.a"
fi

# The FFI functions must all still be exported, and no mangled Rust or C++ symbol (`_ZN`, or `_R`
# for Rust's v0 mangling) may be.
exported "$IN" >"$TMP/before.txt"
exported "$TMP/out.a" >"$TMP/after.txt"
ffi_before="$(grep -cE '^_(uniffi|ffi)_' "$TMP/before.txt" || true)"
ffi_after="$(grep -cE '^_(uniffi|ffi)_' "$TMP/after.txt" || true)"
((ffi_before > 0 && ffi_before == ffi_after)) ||
    die "$IN exports $ffi_before FFI functions, the result $ffi_after"
rust_after="$(grep -cE '^__(ZN|R)' "$TMP/after.txt" || true)"
((rust_after == 0)) || die "the result still exports $rust_after Rust symbols"

mv "$TMP/out.a" "$OUT"
echo "    ${archs[*]}: exported symbols $(wc -l <"$TMP/before.txt" | tr -d ' ') ->" \
    "$(wc -l <"$TMP/after.txt" | tr -d ' '), of which $ffi_after FFI functions"
