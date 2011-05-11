'''Used for setting up a request handler in CGI scripts which want to implement a protocol based on JSON.'''

import sys, os, json, cgi
from os import path
from urllib import parse

class CGIRequestError(Exception):
	def __init__(self, status_code, message):
		self.status_code = status_code
		self.message = message
	
	def __str__(self):
		return 'HTTP Error %s' % self.status_code


class BareResponse():
	def __init__(self, content_type, data):
		self.mime_type = content_type
		self.data = data


# Define a custon exception handler which will be called on uncaught exceptions and return a valid HTTP error message
def fromat_stacktrace(type, value, traceback):
	lines = []
	
	if value:
		lines = ['Exception: %s: %s' % (type.__name__, value)]
	else:
		desc = ['Exception: %s' % type.__name__]
	
	tbs = []
	dir = path.dirname(traceback.tb_frame.f_code.co_filename) + '/' # directory where the main script is located
	
	# gather all stack frames
	while traceback != None:
		tbs.append(traceback)
		traceback = traceback.tb_next
	
	for tb in reversed(tbs):
		code = tb.tb_frame.f_code
		file = os.path.abspath(code.co_filename)
		name = code.co_name
		
		# strip the directory part of the file name, if it lies in the folder of the main script
		if file.startswith(dir): file = file[len(dir):]
		if name != '<module>': name += '()'
		
		lines.append('%s: %s: Line %s' % (file, name, tb.tb_lineno))
	
	return lines


def send_response(status_code, body):
	# prepare data; we're trying to catch any errors before we write the headers so we can send a different status code if an exception get's thrown
	
	if isinstance(body, BareResponse):
		content_type = body.content_type
		body_data = body.data
	elif isinstance(body, str):
		content_type = 'text/plain'
		body_data = body = body.encode('utf-8')
	else:
		content_type = 'application/json'
		body_data = json.dumps(body, indent = '\t', ensure_ascii = False).encode('utf-8')
	
	# print headers
	print('Content-Type: %s; charset=utf-8' % content_type)
	print('Content-Length: %s' % len(body_data))
	print('Status: %s' % status_code)
	print('')
	sys.stdout.flush() # sys.stdout may be opened in block-buffering mode
	
	# print the actual, encoded data.
	sys.stdout.buffer.write(body_data)
	sys.stdout.buffer.flush()


def handle_request(handler):
	'''hander should be a function which takes the arguments (request, attachments), where request is the request body or URL-encoded data decoded as a JSON object and attachments is a dictionary mapping file names to file objects for any uploaded files.
	
	The function should return a tuple of the form (status, data) where status is the HTTP status code to send and an object which will be encoded as JSON object.'''
	
	try:
		# parse the complete query string as a json object
		method = os.environ['REQUEST_METHOD'].lower()
		query = os.environ['QUERY_STRING'].split('&')[0]
		data = json.loads(parse.unquote(query))
		files = { }
		
		if method == 'post':
			storage = cgi.FieldStorage() 
			
			for i in storage:
				files[i] = (storage[i].filename, storage[i].file)
		elif method != 'get':
			raise CGIRequestError(405, 'Method Not Allowed')
		
		result = handler(data, files)
		send_response(200, result)
	except CGIRequestError as e:
		send_response(e.status_code, e.message)
	except:
		lines = fromat_stacktrace(*sys.exc_info())
		send_response(500, '\n'.join(lines))

