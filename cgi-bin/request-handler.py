#! /usr/bin/env python3.2

import sys, types, cgi, db, jsonrpc


class Handler:
	def __call__(self, data, files):
		action = data['action']
		method = getattr(self, action.replace('-', '_'), None)
		kwargs = dict(files)
		
		for k, v in data.items():
			if k != 'action':
				kwargs[k.replace('-', '_')] = v
		
		if not isinstance(method, types.MethodType):
			raise jsonrpc.CGIRequestError(400, 'Unknown command: ' + action)
		
		return method(**kwargs)
	
	@db.in_transaction
	def upload_gallery_image(self, image, area_name, title, comment):		
		if not db.galleryarea_exists(area_name):
			raise jsonrpc.CGIRequestError(404, 'No such gallery: ' + area_name)
			
		filename, image_file = image
		image_blob = image_file.read()
		
		image_id = db.add_gallery_image(area_name, filename, image_blob, None, None, title, comment)
		
		return { 'image-id': image_id }
	
	@db.in_transaction
	def list_gallery_images(self, area_name):
		if not db.galleryarea_exists(area_name):
			raise jsonrpc.CGIRequestError(404, 'No such gallery: ' + area_name)
		
		return db.get_gallery_images(area_name)
	
	@db.in_transaction
	def delete_gallery_image(self, area_name, image_id):
		if not db.galleryarea_exists(area_name):
			raise jsonrpc.CGIRequestError(404, 'No such gallery: ' + area_name)
		
		db.delete_gallery_image(area_name, image_id)
		db.cleanup_orphan_images()
	
	@db.in_transaction
	def get_image(self, image_id):
		return jsonrpc.BareResponse('image/jpeg', db.get_image(image_id))


jsonrpc.handle_request(Handler())
