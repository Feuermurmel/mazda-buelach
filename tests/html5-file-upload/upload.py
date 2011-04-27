#! /usr/bin/env python3.2

import sys, cgi, cgitb

cgitb.enable(format = False, context = 0)

print('Content-Type: text/plain')
print()

storage = cgi.FieldStorage()
print(storage.keys(), file = sys.stderr)

file = storage['fileToUpload'].file
with open('upload/' + storage['fileToUpload'].filename, 'wb') as outFile:
	while True:
		buffer = file.read(1024 * 1024)
		
		if not buffer: break
		
		outFile.write(buffer)

print('Done.')
