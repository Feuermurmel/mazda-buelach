#! /usr/bin/env bash

set -e -o pipefail

cd "$(dirname "$BASH_SOURCE")/cgi-bin"

./create-db.py -f
./create-test-data.py
