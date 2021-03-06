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
		
		try:
			return method(**kwargs)
		except db.IntegrityError as e:
			status = '%s: %s' % (type(e).__name__, str(e))
			
			raise jsonrpc.CGIRequestError(400, status)
	#	except KeyError as e:
	#		status = '%s: %s' % (type(e).__name__, str(e))
	#		
	#		raise jsonrpc.CGIRequestError(404, status)
	
	@db.in_transaction
	def upload_gallery_image(self, area_name, image, title, comment):
		filename, image_file = image
		image_blob = image_file.read()
		
		return db.add_gallery_image(area_name, os.path.splitext(filename)[0], image_blob, None, None, title, comment)
	
	@db.in_transaction
	def update_gallery_image(self, area_name, image_id, title, comment):
		db.update_gallery_image(area_name, image_id, title, comment)
	
	@db.in_transaction
	def set_gallery_order(self, area_name, image_ids):
		return db.set_gallery_order(area_name, image_ids)
	
	@db.in_transaction
	def delete_gallery_image(self, area_name, image_id):
		db.delete_gallery_image(area_name, image_id)
		db.cleanup_orphan_images()
	
	@db.in_transaction
	def revert_gallery(self, area_name):
		db.sync_gallery_area(area_name, db.version_new, db.version_current)
		db.cleanup_orphan_images()
	
	def list_gallery_images(self, area_name, version = db.version_new):
		return db.list_gallery_images(area_name, version)
	
	def get_gallery_image(self, area_name, image_id, version = db.version_new):
		return jsonrpc.BareResponse('image/jpeg', db.get_gallery_image(area_name, image_id))
	
	@db.in_transaction
	def upload_text_image(self, area_name, image):
		filename, image_file = image
		image_blob = image_file.read()
		
		return db.add_text_image(area_name, os.path.splitext(filename)[0], image_blob, None, None)
	
	@db.in_transaction
	def delete_text_image(self, area_name, image_id):
		db.delete_text_image(area_name, image_id)
		db.cleanup_orphan_images()
	
	@db.in_transaction
	def update_text_content(self, area_name, content):
		db.update_text_content(area_name, content)
	
	@db.in_transaction
	def revert_text(self, area_name):
		db.sync_text_area(area_name, db.version_new, db.version_current)
		db.cleanup_orphan_images()
	
	def get_text_content(self, area_name, version = db.version_new):
		return db.get_text_content(area_name)
	
	def list_text_images(self, area_name, version = db.version_new):
		return db.list_text_images(area_name, version)
	
	def get_text_image(self, area_name, image_id, version = db.version_new):
		return jsonrpc.BareResponse('image/jpeg', db.get_text_image(area_name, image_id))
	
	def activate_changes(self, generate_page = True):
		if generate_page:
			pass
		
		with db.get_connection():
			db.sync_all(db.version_current, db.version_new)
			db.cleanup_orphan_images()


jsonrpc.handle_request(Handler())
