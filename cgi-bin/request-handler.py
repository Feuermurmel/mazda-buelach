#! /usr/bin/env python3.2


import jsonrpc, cgi, sys


def handler(data, file):
	import sys
	
	
	return len(file.read())


jsonrpc.handle_request(handler)
