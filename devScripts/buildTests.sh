#!/bin/bash
# note - I use these scripts, as I can't stop vscode ides gulp runner from changing the debug console window, which is annoying.

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"/..

export TS_NODE_COMPILER_OPTIONS='{"incremental":true, "allowJs":false}'
export TS_NODE_TRANSPILE_ONLY=true 

gulp buildFrameworkTests
