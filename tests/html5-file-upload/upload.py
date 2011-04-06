#! /usr/bin/env python3.2

import cgi, cgitb

cgitb.enable()

print('Content-Type: text/html')
print()

storage = cgi.FieldStorage()

file = storage['fileToUpload'].file
outFile = open('upload/' + storage['fileToUpload'].filename, 'wb')
outFile.write(file)

print('fooo');
