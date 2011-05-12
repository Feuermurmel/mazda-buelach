#! /usr/bin/env python3.2

import jsonrpc, cgi, sys, db


def handler(data, files):
	if data['action'] == 'upload-gallery-image':
		with db.get_connection() as conn:
			filename, image_file = files['image']
			
			image_blob = image_file.read()
			
			id = db.add_gallery_image(data['area-name'], filename, image_blob, None, None, data['title'], data['comment'])
			
			return { 'id': id }
	if data['action'] == 'list-gallery-images':
		with db.get_connection() as conn:
			area_name = data['area-name']
			list = db.get_gallery_images(area_name)
			
			return list
	if data['action'] == 'get-image':
		with db.get_connection() as conn:
			id = data['id']
			blob = db.get_image(id)
			
			return jsonrpc.BareResponse('image/jpeg', blob)
	else:
		raise CGIRequestError(400, 'Unknown command: ' + data['action'])
	
#	return repr(list((n, len(f.read())) for n, f in files.values()))


jsonrpc.handle_request(handler)
