#!/usr/bin/env bash
#
# Tests scripts/hide-ios-symbols.sh, which hides every global symbol of an iOS static library
# except the FFI functions (`_uniffi_*`, `_ffi_*`) that the bindings call.
#
#   scripts/test-hide-ios-symbols.sh
#
# The script needs macOS with Xcode, so it cannot run for real here. Each case instead runs it
# against fake `xcrun` and `sysctl` programs placed on a PATH of their own. The fakes work on text
# files. An object file is a list of lines: `arch <arch>`, perhaps `flags
# SUBSECTIONS_VIA_SYMBOLS`, symbols as `external <name>`, `private-external <name>` or
# `undefined <name>`, and anything else as code. A static library is its members one after the
# other, each from a `member <name>` line to an `end` line. The fake `ld -r` makes every external
# symbol that its list does not name a private external one, as the real one does with
# `-keep_private_externs`, and every fake logs each call to a file. That pins down which objects
# are linked and which are copied, the arguments of every `ld` call, what the result exports and
# what the script refuses: members of the same name, which `ar x` would write over each other, a
# result that exports Rust symbols or lost an FFI function, and a failing tool. Nothing in this
# checkout is touched, and nothing beyond bash and the POSIX tools the script uses is needed.
#
# Only thin libraries are covered: the fake `lipo` fails on the calls the script makes for a fat
# one.
#
# SCRIPT_UNDER_TEST names another copy of the script to run in place of
# scripts/hide-ios-symbols.sh. Pointing it at a deliberately broken copy shows that the cases can
# fail.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="${SCRIPT_UNDER_TEST:-$ROOT/scripts/hide-ios-symbols.sh}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

FAKES=(xcrun sysctl)
# The system programs the script uses. The fakes use some of them too.
SYSTEM_TOOLS=(awk bash cat cp find grep head mkdir mktemp mv rm sh sort tr wc xargs)

passed=0
failed=0

pass() {
    passed=$((passed + 1))
    echo "  ok    $1"
}

fail() {
    failed=$((failed + 1))
    echo "  FAIL  $1"
    [[ -z "${2:-}" ]] || printf '        %s\n' "${2//$'\n'/$'\n'        }"
}

# expect_ok <name> <expected output> -- <command...>: succeeds and prints exactly that.
expect_ok() {
    local name="$1" want="$2" out
    shift 3
    if out="$("$@" 2>&1)"; then
        if [[ "$out" == "$want" ]]; then
            pass "$name"
        else
            fail "$name" "expected: $want"$'\n'"got: $out"
        fi
    else
        fail "$name" "exited non-zero: $out"
    fi
}

# expect_fail <name> <expected text in output> -- <command...>: fails and prints that text.
expect_fail() {
    local name="$1" want="$2" out
    shift 3
    if out="$("$@" 2>&1)"; then
        fail "$name" "expected a failure, got: $out"
    elif [[ "$out" == *"$want"* ]]; then
        pass "$name"
    else
        fail "$name" "expected the error to mention: $want"$'\n'"got: $out"
    fi
}

# check <name> <condition command...>: passes when the command succeeds.
check() {
    local name="$1"
    shift
    if "$@"; then pass "$name"; else fail "$name"; fi
}

# The fake programs. Each appends one line to $FAKE_LOG: its name and arguments, and for `xcrun ld`
# also a `|` and the symbols list it was handed, which the script deletes when it is done. The
# variables FAKE_LD_FAILS (the name of an object), FAKE_LD_HIDES (a glob of the symbols that ld
# hides even when its list names them) and FAKE_NM_FAILS make xcrun misbehave. It refuses every
# call that the script is not meant to make, a fat library's among them.
FAKES_DIR="$WORK/fakes"
mkdir -p "$FAKES_DIR"

cat >"$FAKES_DIR/xcrun" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

call="xcrun $*"
tool="${1:-}"
shift || true

# log [<note>]: logs the call, and the note after a `|`.
log() {
    echo "$call${1:+ | $1}" >>"$FAKE_LOG"
}

unexpected() {
    log
    echo "fake xcrun: unexpected call: $call" >&2
    exit 2
}

case "$tool" in
    lipo)
        # The distinct architectures of the members. A fat library is not supported.
        [[ $# -eq 2 && "$1" == -archs ]] || unexpected
        log
        archs=""
        while IFS= read -r line || [[ -n "$line" ]]; do
            [[ "$line" == "arch "* ]] || continue
            arch="${line#arch }"
            case " $archs " in
                *" $arch "*) ;;
                *) archs="${archs:+$archs }$arch" ;;
            esac
        done <"$2"
        echo "$archs"
        ;;
    ar)
        [[ $# -eq 2 ]] || unexpected
        log
        case "$1" in
            t)
                while IFS= read -r line || [[ -n "$line" ]]; do
                    [[ "$line" != "member "* ]] || printf '%s\n' "${line#member }"
                done <"$2"
                ;;
            x)
                # A member is written to a file of its name, which replaces any earlier member of
                # that name.
                name=""
                while IFS= read -r line || [[ -n "$line" ]]; do
                    case "$line" in
                        "member "*)
                            name="${line#member }"
                            : >"$name"
                            ;;
                        end)
                            name=""
                            ;;
                        *)
                            printf '%s\n' "$line" >>"$name"
                            ;;
                    esac
                done <"$2"
                ;;
            *)
                unexpected
                ;;
        esac
        ;;
    otool)
        [[ $# -eq 2 && "$1" == -hv ]] || unexpected
        log
        flags=0x00000000
        while IFS= read -r line || [[ -n "$line" ]]; do
            [[ "$line" != "flags "* ]] || flags="${line#flags }"
        done <"$2"
        echo "Mach header"
        echo "MH_MAGIC_64 ARM64 OBJECT $flags"
        ;;
    ld)
        # ld -r -keep_private_externs -arch <arch> -exported_symbols_list <list> <obj> -o <out>
        [[ $# -eq 9 && "$1" == -r && "$2" == -keep_private_externs && "$3" == -arch &&
            "$5" == -exported_symbols_list && "$8" == -o ]] || unexpected
        list="$6"
        obj="$7"
        out="$9"
        patterns=()
        while IFS= read -r pattern || [[ -n "$pattern" ]]; do
            patterns+=("$pattern")
        done <"$list"
        log "list=${patterns[*]}"
        if [[ "${obj##*/}" == "${FAKE_LD_FAILS:-}" ]]; then
            echo "fake ld: cannot link ${obj##*/}" >&2
            exit 1
        fi
        while IFS= read -r line || [[ -n "$line" ]]; do
            if [[ "$line" != "external "* ]]; then
                printf '%s\n' "$line"
                continue
            fi
            name="${line#external }"
            exported=""
            # shellcheck disable=SC2053 # FAKE_LD_HIDES is a glob on purpose.
            if [[ -z "${FAKE_LD_HIDES:-}" || "$name" != ${FAKE_LD_HIDES:-} ]]; then
                for pattern in "${patterns[@]}"; do
                    # shellcheck disable=SC2053 # The pattern is a glob on purpose.
                    [[ "$name" != $pattern ]] || exported=1
                done
            fi
            if [[ -n "$exported" ]]; then
                printf '%s\n' "$line"
            else
                printf 'private-external %s\n' "$name"
            fi
        done <"$obj" >"$out"
        ;;
    libtool)
        # A member for each file of the list, named after the file. Unlike the real one it makes no
        # symbol table of its own, so a `__.SYMDEF SORTED` member is an object it was handed.
        [[ $# -eq 6 && "$1" == -static && "$2" == -no_warning_for_no_symbols &&
            "$3" == -filelist && "$5" == -o ]] || unexpected
        log
        : >"$6"
        while IFS= read -r path || [[ -n "$path" ]]; do
            {
                echo "member ${path##*/}"
                cat "$path"
                echo end
            } >>"$6"
        done <"$4"
        ;;
    nm)
        [[ $# -eq 3 && "$1" == -m && "$2" == --no-llvm-bc ]] || unexpected
        log
        if [[ -n "${FAKE_NM_FAILS:-}" ]]; then
            echo "nm: $3(empty.o): no symbols" >&2
            echo "fake nm: cannot read the symbol table of $3" >&2
            exit 1
        fi
        while IFS= read -r line || [[ -n "$line" ]]; do
            case "$line" in
                "member "*)
                    printf '\n%s(%s):\n' "$3" "${line#member }"
                    ;;
                "external "*)
                    printf '0000000000000000 (__TEXT,__text) external %s\n' "${line#external }"
                    ;;
                "private-external "*)
                    printf '0000000000000000 (__TEXT,__text) private external %s\n' \
                        "${line#private-external }"
                    ;;
                "undefined "*)
                    printf '                 (undefined) external %s\n' "${line#undefined }"
                    ;;
            esac
        done <"$3"
        ;;
    *)
        unexpected
        ;;
esac
EOF

# The script runs `sysctl -n hw.ncpu` to size its pool of parallel `ld` runs. Linux has no such
# sysctl.
cat >"$FAKES_DIR/sysctl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "sysctl $*" >>"$FAKE_LOG"
if [[ "$*" != "-n hw.ncpu" ]]; then
    echo "fake sysctl: unexpected arguments: $*" >&2
    exit 2
fi
echo 2
EOF
chmod +x "$FAKES_DIR"/*

# A directory of symbolic links to the system programs, plus to the fakes except the one named
# by $2 (if any). It is the whole PATH of a run, so a missing program is really missing, also on
# a machine where Xcode's own tools are in /usr/bin. Prints its path.
path_dir() {
    local name="$1" omit="${2:-}" dir tool
    dir="$WORK/path.$name"
    mkdir -p "$dir"
    for tool in "${SYSTEM_TOOLS[@]}"; do
        ln -s "$(command -v "$tool")" "$dir/$tool"
    done
    for tool in "${FAKES[@]}"; do
        [[ "$tool" == "$omit" ]] || ln -s "$FAKES_DIR/$tool" "$dir/$tool"
    done
    echo "$dir"
}

FULL_PATH="$(path_dir full)"

# The objects of the libraries below. The Rust ones are compiled with MH_SUBSECTIONS_VIA_SYMBOLS,
# like all of rustc's output. They export FFI functions and mangled names (`__ZN` is the legacy
# mangling, `__R` the v0 one), and refer to a C function and to a Rust function of another object,
# neither of which is an export. The assembly object is like aws-lc's: no such flag, and a short
# C name.
RUST_A='arch arm64
flags SUBSECTIONS_VIA_SYMBOLS
external _uniffi_fedimint_sdk_fn_func_a
external __ZN4core3fmt5write17h0123456789abcdefE
undefined _malloc
undefined __ZN5alloc7raw_vec11finish_grow17hfedcba9876543210E
code of the first Rust object'
RUST_B='arch arm64
flags SUBSECTIONS_VIA_SYMBOLS
external _ffi_fedimint_sdk_rustbuffer_alloc
external _uniffi_fedimint_sdk_fn_func_b
external __RNvCs8vLm0Kp1fQr_14fedimint_sdk4init
undefined _malloc
code of the second Rust object'
ASM='arch arm64
external _aws_lc_sha256_block_data_order
code of the assembly object'
UTIL_FIRST='arch arm64
external _util_first
code of the first util.o'
UTIL_SECOND='arch arm64
external _util_second
code of the second util.o'
# Rust without the flag, which the script copies as it does assembly, so its names stay exported.
UNFLAGGED='arch arm64
external __ZN6legacy4main17h0011223344556677E
external __RNvCs9Zz1Yy2Xx3W_6legacy5other
code of a Rust object without the flag'
# Rust with no FFI function.
NO_FFI='arch arm64
flags SUBSECTIONS_VIA_SYMBOLS
external __ZN4core3fmt5write17h0123456789abcdefE
code of a Rust object without FFI functions'

# What ld leaves of the Rust objects: their mangled names are private externals.
RUST_A_HIDDEN="${RUST_A/external __ZN/private-external __ZN}"
RUST_B_HIDDEN="${RUST_B/external __R/private-external __R}"

# What the script makes of the standard library below, with the order of its members.
RESULT_MEMBERS='aws_lc_asm.o
fedimint_sdk.rcgu0.o
fedimint_sdk.rcgu1.o'
RESULT_EXPORTS='_aws_lc_sha256_block_data_order
_ffi_fedimint_sdk_rustbuffer_alloc
_uniffi_fedimint_sdk_fn_func_a
_uniffi_fedimint_sdk_fn_func_b'
# Six exported symbols (the two mangled ones among them) are left with four, three of them FFI.
SUMMARY="    arm64: exported symbols 6 -> 4, of which 3 FFI functions"

# put_member <name> <object>: prints the library member of that name.
put_member() {
    printf 'member %s\n%s\nend\n' "$1" "$2"
}

# The library libtool makes: its symbol table first, then the objects, in no particular order.
lib_standard() {
    put_member '__.SYMDEF SORTED' 'symbol table'
    put_member fedimint_sdk.rcgu1.o "$RUST_B"
    put_member aws_lc_asm.o "$ASM"
    put_member fedimint_sdk.rcgu0.o "$RUST_A"
}

# Two members of one name, as objects of two C libraries can be.
lib_same_name() {
    put_member util.o "$UTIL_FIRST"
    put_member fedimint_sdk.rcgu0.o "$RUST_A"
    put_member util.o "$UTIL_SECOND"
}

# A Rust object without the flag next to one with it, which has the FFI functions.
lib_unflagged() {
    put_member fedimint_sdk.rcgu0.o "$RUST_A"
    put_member legacy.o "$UNFLAGGED"
}

# No FFI function anywhere.
lib_no_ffi() {
    put_member aws_lc_asm.o "$ASM"
    put_member fedimint_sdk.rcgu0.o "$NO_FFI"
}

# A fresh directory <case> holding the library lib.a that the function lib_$1 prints, a copy of it
# as lib.orig, and an empty tmp for the TMPDIR of the runs. Prints the path of <case>.
make_case() {
    local case_dir
    case_dir="$(mktemp -d "$WORK/case.XXXX")"
    mkdir "$case_dir/tmp"
    "lib_$1" >"$case_dir/lib.a"
    cp "$case_dir/lib.a" "$case_dir/lib.orig"
    echo "$case_dir"
}

# run <case> [--path <dir>] [VAR=value...] -- <script arguments...>: runs the script with only the
# fakes and the system programs on PATH, the tmp of the case as its TMPDIR, a fresh call log and
# the C locale, which fixes the order `sort` gives the objects.
run() {
    local case_dir="$1" path="$FULL_PATH" vars=()
    shift
    if [[ "${1:-}" == "--path" ]]; then
        path="$2"
        shift 2
    fi
    while [[ $# -gt 0 && "$1" != "--" ]]; do
        vars+=("$1")
        shift
    done
    [[ "${1:-}" != "--" ]] || shift
    : >"$case_dir/calls.log"
    env PATH="$path" TMPDIR="$case_dir/tmp" FAKE_LOG="$case_dir/calls.log" LC_ALL=C \
        ${vars[@]+"${vars[@]}"} "$SCRIPT" "$@"
}

# contains <text> <needle>: succeeds when <text> has <needle> in it.
contains() {
    [[ "$1" == *"$2"* ]]
}

# lacks <text> <needle>: succeeds when <text> does not have <needle> in it.
lacks() {
    [[ "$1" != *"$2"* ]]
}

# differs <file> <file>: succeeds when the files are not the same.
differs() {
    ! cmp -s "$1" "$2"
}

# unchanged <case>: succeeds when the library of the case is byte for byte as it was made.
unchanged() {
    cmp -s "$1/lib.a" "$1/lib.orig"
}

# The number of lines of <case>'s call log that match the glob pattern $2.
log_count() {
    local pattern="$2" line count=0
    while IFS= read -r line; do
        # shellcheck disable=SC2053 # The pattern is a glob on purpose.
        if [[ "$line" == $pattern ]]; then count=$((count + 1)); fi
    done <"$1/calls.log"
    echo "$count"
}

# The pattern for the log line of the `ld` call on the object named $2 in <case> $1. The directory
# that the script makes under the TMPDIR has a random name, which the pattern leaves open. The
# `\*` is the `*` of the symbols list.
ld_call() {
    local tmp="$1/tmp/*"
    echo "xcrun ld -r -keep_private_externs -arch arm64" \
        "-exported_symbols_list $tmp/ffi-symbols.txt" \
        "$tmp/arm64/objects/$2 -o $tmp/arm64/hidden/$2 | list=_uniffi_\* _ffi_\*"
}

# The names of everything in <dir>, one per line, relative to it. Nothing if it is empty.
entries() {
    (cd "$1" && find . -mindepth 1 | sort)
}

# The names of the members of a library, one per line, in order.
member_names() {
    sed -n 's/^member //p' "$1"
}

# member_text <library> <name>: the lines of the member of that name.
member_text() {
    awk -v name="$2" '
        $0 == "member " name { inside = 1; next }
        $0 == "end" { inside = 0; next }
        inside { print }
    ' "$1"
}

# The symbols a library exports, one per line, sorted.
exports() {
    sed -n 's/^external //p' "$1" | LC_ALL=C sort
}

# check_result <what> <library>: <library> is what the script makes of the standard library.
check_result() {
    local what="$1" lib="$2"
    expect_ok "$what has the objects in name order, and no __.SYMDEF SORTED" \
        "$RESULT_MEMBERS" -- member_names "$lib"
    expect_ok "$what exports the FFI functions and the C function, nothing else" \
        "$RESULT_EXPORTS" -- exports "$lib"
    expect_ok "$what has the mangled names of the first Rust object hidden" \
        "$RUST_A_HIDDEN" -- member_text "$lib" fedimint_sdk.rcgu0.o
    expect_ok "$what has the mangled names of the second Rust object hidden" \
        "$RUST_B_HIDDEN" -- member_text "$lib" fedimint_sdk.rcgu1.o
    expect_ok "$what has the assembly object as it was" \
        "$ASM" -- member_text "$lib" aws_lc_asm.o
}

echo "a library replaced in place"

d="$(make_case standard)"
expect_ok "hiding the symbols of a library in place succeeds and prints the counts" \
    "$SUMMARY" -- run "$d" -- "$d/lib.a"
check "the library is replaced" differs "$d/lib.a" "$d/lib.orig"
check_result "the replaced library" "$d/lib.a"
check "ld runs once for each of the two Rust objects, 2 in all" \
    test "$(log_count "$d" 'xcrun ld *')" = 2
for object in fedimint_sdk.rcgu0.o fedimint_sdk.rcgu1.o; do
    check "$object goes through ld -r once, exporting nothing but the FFI functions" \
        test "$(log_count "$d" "$(ld_call "$d" "$object")")" = 1
done
check "ld does not run on the assembly object" \
    test "$(log_count "$d" 'xcrun ld *aws_lc_asm.o*')" = 0
check "ld does not run on the symbol table" test "$(log_count "$d" 'xcrun ld *SYMDEF*')" = 0
check "the script worked under its TMPDIR" test "$(log_count "$d" "*$d/tmp/*")" -gt 0
check "no temporary directory is left after a successful run" test -z "$(entries "$d/tmp")"

echo
echo "a library with an output path"

d="$(make_case standard)"
expect_ok "hiding the symbols of a library into another file succeeds and prints the counts" \
    "$SUMMARY" -- run "$d" -- "$d/lib.a" "$d/out.a"
check "the input library is unchanged byte for byte" unchanged "$d"
check_result "the output library" "$d/out.a"

echo
echo "members of the same name"

d="$(make_case same_name)"
expect_fail "two members of one name fail the run with the member count" \
    "$d/lib.a (arm64) has 3 members but only 2 distinct names" -- \
    run "$d" -- "$d/lib.a" "$d/out.a"
check "the input library is unchanged" unchanged "$d"
check "no output is written" test ! -e "$d/out.a"
check "ld does not run" test "$(log_count "$d" 'xcrun ld *')" = 0

echo
echo "an object without the flag that exports Rust symbols"

d="$(make_case unflagged)"
expect_fail "the unflagged object is copied, so the result still exports its Rust symbols" \
    "the result still exports 2 Rust symbols" -- run "$d" -- "$d/lib.a" "$d/out.a"
check "the input library is unchanged" unchanged "$d"
check "no output is written" test ! -e "$d/out.a"
check "ld runs on the flagged object only" test "$(log_count "$d" 'xcrun ld *')" = 1

echo
echo "FFI functions"

d="$(make_case standard)"
expect_fail "an ld that hides the FFI functions too fails the run with the counts" \
    "$d/lib.a exports 3 FFI functions, the result 0" -- run "$d" FAKE_LD_HIDES='*' -- "$d/lib.a"
check "the input library is unchanged" unchanged "$d"

# Losing one FFI function is as wrong as losing all of them.
d="$(make_case standard)"
expect_fail "an ld that hides one FFI function fails the run with the counts" \
    "$d/lib.a exports 3 FFI functions, the result 2" -- \
    run "$d" FAKE_LD_HIDES=_uniffi_fedimint_sdk_fn_func_b -- "$d/lib.a"
check "the input library is unchanged" unchanged "$d"

d="$(make_case no_ffi)"
expect_fail "a library without any FFI function fails the run" \
    "$d/lib.a exports 0 FFI functions, the result 0" -- run "$d" -- "$d/lib.a" "$d/out.a"
check "the input library is unchanged" unchanged "$d"
check "no output is written" test ! -e "$d/out.a"

echo
echo "a failing tool"

d="$(make_case standard)"
expect_fail "an ld that fails on one object fails the run with its message" \
    "fake ld: cannot link fedimint_sdk.rcgu1.o" -- \
    run "$d" FAKE_LD_FAILS=fedimint_sdk.rcgu1.o -- "$d/lib.a" "$d/out.a"
check "the input library is unchanged" unchanged "$d"
check "no output is written" test ! -e "$d/out.a"
check "no library is made after the failure" test "$(log_count "$d" 'xcrun libtool *')" = 0
check "the script worked under its TMPDIR" test "$(log_count "$d" "*$d/tmp/*")" -gt 0
check "no temporary directory is left after a failing run" test -z "$(entries "$d/tmp")"

d="$(make_case standard)"
status=0
out="$(run "$d" FAKE_NM_FAILS=1 -- "$d/lib.a" 2>&1)" || status=$?
check "a failing nm fails the run" test "$status" -ne 0
check "it says that nm failed, on what and why" \
    contains "$out" "nm failed on $d/lib.a: fake nm: cannot read the symbol table of $d/lib.a"
check "it leaves out the warnings about members without symbols" lacks "$out" "no symbols"
check "the input library is unchanged" unchanged "$d"

echo
echo "usage"

d="$(make_case standard)"
expect_fail "no argument is a usage error" "usage: $SCRIPT <in.a> [<out.a>]" -- run "$d" --
check "no argument runs nothing" test ! -s "$d/calls.log"
expect_fail "three arguments are a usage error" "usage: $SCRIPT <in.a> [<out.a>]" -- \
    run "$d" -- "$d/lib.a" "$d/out.a" "$d/third.a"
check "three arguments run nothing" test ! -s "$d/calls.log"
expect_fail "a missing library is named" "no library at $d/missing.a" -- \
    run "$d" -- "$d/missing.a"
check "a missing library runs nothing" test ! -s "$d/calls.log"
expect_fail "without xcrun on PATH the script says so" "xcrun not found" -- \
    run "$d" --path "$(path_dir no-xcrun xcrun)" -- "$d/lib.a"
check "without xcrun nothing is run" test ! -s "$d/calls.log"
check "the input library is unchanged" unchanged "$d"

echo
echo "$passed passed, $failed failed"
[[ "$failed" -eq 0 ]]
