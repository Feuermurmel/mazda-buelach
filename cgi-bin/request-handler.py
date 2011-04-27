#! /usr/bin/env python3.2

import jsonrpc, cgi, sys


def handler(data, attachments):
	import sys
	
	res = cgi.parse(sys.stdin)
	
#	print({ i: getattr(data["textline"], i) for i in dir(data["textline"]) })
	
	return repr({ k: (v.type, v.value, v.name) for k, v in data.items() })


jsonrpc.handle_request(handler)
