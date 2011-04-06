import re, db

def process_areas(text, handler):
	'''Searches for processing instructions enclosed in <% %> pairs and calls the handler with the processing instructions.
	
	For the following processing instructions:
		<% proc arg1="foo" arg2="bar" %>
	The handler will be called like this:
		handler('proc', { 'arg1': 'foo', 'arg2': 'bar' })'''
	
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
	last_end_pos = 0
	
	for i in re.finditer(proc_instr, text):
		attrs = { }
		
		for j in re.finditer(attr, i.group('attrs')):
			attrs[i.group('name')] = i.group('value')
		
		replacement = handler(i.group('instr'), attrs)
		
		processed_text += text[last_end_pos:i.start()] + replacement
		last_end_pos = i.end()
	
	return processed_text + text[i.end():]
