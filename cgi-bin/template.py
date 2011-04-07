import re, util, config
from os import path

@util.memorized
def get_snippet(name):
	'''Loads the content of a file in the snippets directory and returns it as a string'''
	
	fpath = path.join(config.paths.snippets, name)
	
	return util.read_file(fpath)

def process_areas(text, handler):
	'''Searches for processing instructions enclosed in <% %> pairs and calls the handler with the processing instructions.
	
	For the following processing instructions:
		<% proc arg1="foo" arg2="bar" %>
	The handler will be called like this:
		handler['proc'](arg1 = 'foo', arg2 = 'bar')'''
	
	# defines a group with a given name and containing pattern
	def grp(pattern, repetition = None, *, name = None):
		result = pattern
		
		if repetition != None:
			result = '(?:' + pattern + ')' + repetition
		elif name == None:
			result = '(?:' + pattern + ')'
		
		if name != None:
			result = '(?P<' + name + '>' + result + ')'
		
		return result
	
	# regex to match an identifier
	id = '[A-Za-z$_][A-Za-z0-9$_-]*'
	
	# whitespace
	ws = r'[\n\t ]*'
	
	# required whitespace
	wsr = r'[\n\t ]+'
	
	# matches an attribute and value
	attr = wsr + grp(id, name = 'name') + ws + '=' + ws + '"' + grp(r'[^"\n\t]*', name = 'value') + '"'
	
	# a full processing instruction part
	proc_instr = '<%' + ws + grp(id, name = 'instr') + grp(attr, '*', name = 'attrs') + ws + '%>'
	
	processed_text = ''
	prev_end_pos = 0
	
	for i in re.finditer(proc_instr, text):
		attrs = { }
		
		for j in re.finditer(attr, i.group('attrs')):
			attrs[i.group('name')] = i.group('value')
		
		replacement = getattr(handler, i.group('instr'))(**attrs)
		
		processed_text += text[prev_end_pos:i.start()] + replacement
		prev_end_pos = i.end()
	
	return processed_text + text[prev_end_pos:]

