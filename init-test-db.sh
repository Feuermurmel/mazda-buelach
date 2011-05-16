#! /usr/bin/env bash

cd "$(dirname "$BASH_SOURCE")/cgi-bin"

rm -f '../db.sqlite'
./create-db.py
./create-test-data.py
