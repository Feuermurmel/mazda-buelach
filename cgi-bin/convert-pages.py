#! /usr/bin/env python3.2

import sys, os, config, db, template, util, datetime
from os import path

class Handler:
	@staticmethod
	def textarea(name):
		return db.get_textarea(name)
	
	@staticmethod
	def snippet(name):
		return template.process_areas(template.get_snippet(name), Handler)
	
	@staticmethod
	def datetime(format):
		return datetime.datetime.now().strftime(format)

def template_files():
	'''Returns an iterator which lists the paths of all files ought for processing in the templates directory.'''
	
	for dir, _, files in os.walk(config.paths.templates):
		for file in files:
			# only process html files
			if path.splitext(file)[1] == '.html':
				yield path.join(dir, file)

for i in template_files():
	# find the new path to put the processed file
	relpath = path.relpath(i, config.paths.templates)
	newpath = path.join(config.paths.output, relpath)
	
	print(newpath)
	
	# read the file, process it and write the result into a new file
	content = util.read_file(i)
	newcontent = template.process_areas(content, Handler)
	util.write_file(newpath, newcontent, overwrite = True)


#print(template.process_areas(open(sys.argv[1], 'rb').read().decode('utf-8'), handler))

