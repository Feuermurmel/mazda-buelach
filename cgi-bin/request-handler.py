#! /usr/bin/env python3.2

import jsonrpc, cgi, sys


def handler(data, files):
	raise jsonrpc.CGIRequestError(567, 'foo')
	return repr(list((n, len(f.read())) for n, f in files.values()))


jsonrpc.handle_request(handler)
