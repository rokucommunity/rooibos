#!/bin/bash
# note - I use these scripts, as I can't stop vscode ides gulp runner from changing the debug console window, which is annoying.

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"/..

gulp prePublishFrameworkTests
