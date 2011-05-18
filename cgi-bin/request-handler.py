#! /usr/bin/env python3.2

import sys, os, types, cgi, db, jsonrpc


class Handler:
	def __call__(self, data, files):
		action = data['action']
		method = getattr(self, action.replace('-', '_'), None)
		kwargs = { }
		
		for k, v in list(data.items()) + list(dict(files).items()):
			if k != 'action':
				kwargs[k.replace('-', '_')] = v
		
		if not isinstance(method, types.MethodType):
			raise jsonrpc.CGIRequestError(400, 'Unknown command: ' + action)
		
		return method(**kwargs)
	
	@db.in_transaction
	def upload_gallery_image(self, area_name, image, title, comment):
		if not db.galleryarea_exists(area_name):
			raise jsonrpc.CGIRequestError(404, 'No such gallery: ' + area_name)
			
		filename, image_file = image
		image_blob = image_file.read()
		
		image_id = db.add_gallery_image(area_name, os.path.splitext(filename)[0], image_blob, None, None, title, comment)
		
		return { 'image-id': image_id }
	
	@db.in_transaction
	def update_gallery_image(self, area_name, image_id, title, comment):
		if not db.galleryarea_exists(area_name):
			raise jsonrpc.CGIRequestError(404, 'No such gallery: ' + area_name)
		
		db.update_gallery_image(area_name, image_id, title, comment)
	
	@db.in_transaction
	def list_gallery_images(self, area_name):
		if not db.galleryarea_exists(area_name):
			raise jsonrpc.CGIRequestError(404, 'No such gallery: ' + area_name)
		
		return db.list_gallery_images(area_name)
	
	@db.in_transaction
	def set_gallery_order(self, area_name, image_ids):
		if not db.galleryarea_exists(area_name):
			raise jsonrpc.CGIRequestError(404, 'No such gallery: ' + area_name)
		
		return db.set_gallery_order(area_name, image_ids)
	
	@db.in_transaction
	def delete_gallery_image(self, area_name, image_id):
		if not db.galleryarea_exists(area_name):
			raise jsonrpc.CGIRequestError(404, 'No such gallery: ' + area_name)
		
		if not db.galleryimage_exists(area_name, image_id):
			raise jsonrpc.CGIRequestError(404, 'No image in gallery: %s, %s' % (area_name, image_id))
		
		db.delete_gallery_image(area_name, image_id)
		db.cleanup_orphan_images()
	
	@db.in_transaction
	def upload_text_image(self, area_name, image):		
		if not db.textarea_exists(area_name):
			raise jsonrpc.CGIRequestError(404, 'No such text area: ' + area_name)
			
		filename, image_file = image
		image_blob = image_file.read()
		
		image_id = db.add_text_image(area_name, filename, image_blob, None, None)
		
		return { 'image-id': image_id }
	
	@db.in_transaction
	def list_text_images(self, area_name):
		if not db.textarea_exists(area_name):
			raise jsonrpc.CGIRequestError(404, 'No such text area: ' + area_name)
		
		return db.get_text_images(area_name)
	
	@db.in_transaction
	def delete_text_image(self, area_name, image_id):
		if not db.textarea_exists(area_name):
			raise jsonrpc.CGIRequestError(404, 'No such text area: ' + area_name)
		
		if not db.textimage_exists(area_name, image_id):
			raise jsonrpc.CGIRequestError(404, 'No image in text area: %s, %s' % (area_name, image_id))
		
		db.delete_text_image(area_name, image_id)
		db.cleanup_orphan_images()
	
	@db.in_transaction
	def get_gallery_image(self, area_name, image_id):
		return jsonrpc.BareResponse('image/jpeg', db.get_gallery_image(area_name, image_id))
	
	@db.in_transaction
	def get_text_image(self, area_name, image_id):
		return jsonrpc.BareResponse('image/jpeg', db.get_text_image(area_name, image_id))


jsonrpc.handle_request(Handler())
