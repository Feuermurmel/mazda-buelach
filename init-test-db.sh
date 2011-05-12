#! /usr/bin/env bash -e -o pipefail

cd "$(dirname "$BASH_SOURCE")/cgi-bin"

rm -f '../db.sqlite'
./create-db.py
./create-test-data.py
