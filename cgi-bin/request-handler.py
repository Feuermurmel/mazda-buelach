#! /usr/bin/env python3.2

import jsonrpc, cgi, sys


def handler(data, files):
	return data
#	return repr(list((n, len(f.read())) for n, f in files.values()))


jsonrpc.handle_request(handler)
