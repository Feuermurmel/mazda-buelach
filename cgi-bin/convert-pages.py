#! /usr/bin/env python3.2

import sys, os, config, db, template, util
from os import path

def instruction_handler(instruction, attrs):
	if instruction == 'textarea':
		return db.get_textarea(attrs['name'])

def template_files():
	for dir, _, files in os.walk(config.paths.templates):
		for file in files:
			yield path.join(dir, file)

for i in template_files():
	relpath = path.relpath(i, config.paths.templates)
	newpath = path.join(config.paths.output, relpath)
	
	content = util.read_file(i)
	newcontent = template.process_areas(content, instruction_handler)
	util.write_file(newpath, newcontent, overwrite = True)
	print(newpath)


#print(template.process_areas(open(sys.argv[1], 'rb').read().decode('utf-8'), handler))

