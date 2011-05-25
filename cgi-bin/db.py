import os, stat, itertools, time, datetime, sqlite3, config, util


# Constants used in the 'version' column of the 'area' table to distinguish the active from the prepared version.
version_current = 'current'
version_new = 'new'


class IntegrityError(Exception):
	def __init__(self, message):
		super().__init__(message)


@util.memorized
def get_connection(allow_empty = False):
	'Returns a single, cached connection object for the database.'
	if not exists():
		if not allow_empty:
			raise Exception('The database has not yet been created. Please use crete-db.py to do so.')
		
		# TODO: is this a good idea?
		# Create an empty, world writable directory for the database.
		os.makedirs(os.path.dirname(config.paths.db), exist_ok = True)
		
		# Create an empty, world-read-and-writable file
		with open(config.paths.db, 'wb'): pass
		
		os.chmod(config.paths.db, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IWGRP | stat.S_IROTH | stat.S_IWOTH)
		os.chmod(os.path.dirname(config.paths.db), stat.S_IRUSR | stat.S_IWUSR | stat.S_IXUSR | stat.S_IRGRP | stat.S_IWGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IWOTH | stat.S_IXOTH)
	
	connection = sqlite3.connect(config.paths.db)
	connection.cursor().execute('PRAGMA foreign_keys=ON') # make sure that foreign key constrainst are enforced by the database
	
	return connection


#@util.decorator
def in_transaction(fn):
	def res(*args, **kwargs):
		with get_connection():
			return fn(*args, **kwargs)
	
	return res


def exists():
	'Returns True if the database file already exists and False otherwise.'
	return os.path.exists(config.paths.db)


def add_uploaded_image(blob, width, height):
	cursor = get_connection().cursor()
	
	upload_date = time.mktime(datetime.datetime.now().timetuple())
	cursor.execute('insert into uploaded_image(blob, width, height, upload_date) values (?, ?, ?, ?)', (blob, width, height, upload_date))
	
	return cursor.lastrowid


def textarea_exists(area_name):
	cursor = get_connection().cursor()
	
	cursor.execute('select count(*) from text_area where name = ?', [area_name])
	
	return cursor.fetchone()[0] > 0


def textimage_exists(area_name, image_id):
	if not textarea_exists(area_name):
		raise IntegrityError('No such text image: ' + area_name)
	
	cursor = get_connection().cursor()
	
	cursor.execute('select count(*) from text_image where text_area_name = ? and version = ? and id = ?', [area_name, 'new', image_id])
	
	return cursor.fetchone()[0] > 0


def create_textarea(area_name):
	if not textarea_exists(area_name):
		cursor = get_connection().cursor()
		
		cursor.execute('insert into text_area(name) values (?)', [area_name])


def add_text_image(area_name, base_id, blob, width, height):
	if not textarea_exists(area_name):
		raise IntegrityError('No such text area: ' + area_name)
	
	cursor = get_connection().cursor()
	counter = 0
	upload_date = time.mktime(datetime.datetime.now().timetuple())
	
	for id in util.id_generator(base_id):
		cursor.execute('select count(*) from text_image where id = ? and version = ? and text_area_name = ?', [id, 'new', area_name])
		
		if cursor.fetchone()[0] == 0: break
	
	uploaded_image_id = add_uploaded_image(blob, width, height)
	cursor.execute('insert into text_image(id, version, text_area_name, uploaded_image_id) values (?, ?, ?, ?)', (id, 'new', area_name, uploaded_image_id))
	
	return { 'image-id': id }


def list_text_images(area_name, version):
	if not textarea_exists(area_name):
		raise IntegrityError('No such text area: ' + area_name)
	
	cursor = get_connection().cursor()
	
	cursor.execute('select text_image.id, width, height, upload_date from text_image, uploaded_image where text_area_name = ? and version = ? and text_image.uploaded_image_id = uploaded_image.id', [area_name, version])
	
	return [{ 'image-id': image_id, 'width': width, 'height': height, 'upload-date': upload_date } for image_id, width, height, upload_date in cursor.fetchall()]


def get_text_image(area_name, image_id):
	if not textimage_exists(area_name, image_id):
		raise jsonrpc.CGIRequestError('No such image in text area: %s, %s' % (area_name, image_id))
	
	cursor = get_connection().cursor()
	
	cursor.execute('select blob from text_image, uploaded_image where text_area_name = ? and version = ? and text_image.id = ? and uploaded_image_id = uploaded_image.id', [area_name, 'new', image_id])
	
	return cursor.fetchone()[0]


def delete_text_image(area_name, image_id):
	if not textimage_exists(area_name, image_id):
		raise jsonrpc.CGIRequestError('No such image in text area: %s, %s' % (area_name, image_id))
	
	cursor = get_connection().cursor()
	
	cursor.execute('delete from text_image where text_area_name = ? and version = ? and id = ?', [area_name, 'new', image_id])


def update_text_content(area_name, content):
	if not textarea_exists(area_name):
		raise IntegrityError('No such text area: ' + area_name)
	
	cursor = get_connection().cursor()
	
	cursor.execute('delete from text_area_content where text_area_name = ? and version = ?', [area_name, 'new']) # deletes current content, if there is one
	cursor.execute('insert into text_area_content(text_area_name, version, content) values (?, ?, ?)', [area_name, 'new', content])


def get_text_content(area_name):
	if not textarea_exists(area_name):
		raise IntegrityError('No such text area: ' + area_name)
	
	cursor = get_connection().cursor()
	
	cursor.execute('select count(*) from text_area_content where text_area_name = ? and version = ?', [area_name, 'new'])
	if (cursor.fetchone()[0] == 0):
		return { 'content': '' }
	
	cursor.execute('select content from text_area_content where text_area_name = ? and version = ?', [area_name, 'new'])
	
	return { 'content': cursor.fetchone()[0] }


def sync_text_area(area_name, version_to, version_from):
	cursor = get_connection().cursor()
	
	cursor.execute('delete from text_image where text_area_name = ? and version = ?', [area_name, version_to])
	cursor.execute('delete from text_area_content where text_area_name = ? and version = ?', [area_name, version_to])
	
	cursor.execute('insert into text_image(id, text_area_name, version, uploaded_image_id) select id, ?, ?, uploaded_image_id from text_image where text_area_name = ? and version = ?', [area_name, version_to, area_name, version_from])
	cursor.execute('insert into text_area_content(text_area_name, version, content) select ?, ?, content from text_area_content where text_area_name = ? and version = ?', [area_name, version_to, area_name, version_from])


def galleryarea_exists(area_name):
	cursor = get_connection().cursor()
	
	cursor.execute('select count(*) from gallery_area where name = ?', [area_name])
	
	return cursor.fetchone()[0] > 0


def galleryimage_exists(area_name, image_id):
	if not galleryarea_exists(area_name):
		raise IntegrityError('No such gallery: ' + area_name)
	
	cursor = get_connection().cursor()
	
	cursor.execute('select count(*) from gallery_image where gallery_area_name = ? and version = ? and id = ?', [area_name, 'new', image_id])
	
	return cursor.fetchone()[0] > 0


def create_galleryarea(area_name):
	if not galleryarea_exists(area_name):
		cursor = get_connection().cursor()
		
		cursor.execute('insert into gallery_area(name) values (?)', [area_name])


def gallery_area_exists(area_name):
	cursor = get_connection().cursor()
	
	cursor.execute('select count(*) from gallery_area where name = ?', [area_name])
	
	return cursor.fetchone()[0] > 0


def galleryimage_exists(area_name, image_id):
	if not galleryarea_exists(area_name):
		raise IntegrityError('No such gallery: ' + area_name)
	
	cursor = get_connection().cursor()
	
	cursor.execute('select count(*) from gallery_image where gallery_area_name = ? and version = ? and id = ?', [area_name, 'new', image_id])
	
	return cursor.fetchone()[0] > 0


def add_gallery_image(area_name, base_id, blob, width, height, title, comment):
	if not galleryarea_exists(area_name):
		raise IntegrityError('No such gallery: ' + area_name)
	
	cursor = get_connection().cursor()
	upload_date = time.mktime(datetime.datetime.now().timetuple())
	
	for id in util.id_generator(base_id):
		cursor.execute('select count(*) from gallery_image where id = ? and version = ? and gallery_area_name = ?', [id, 'new', area_name])
		
		if cursor.fetchone()[0] == 0: break
	
	cursor.execute('select max(position) from gallery_image where gallery_area_name = ? and version = ?', [area_name, 'new'])
	res = cursor.fetchone()[0]
	next_pos = 0 if res is None else res + 1
	
	uploaded_image_id = add_uploaded_image(blob, width, height)
	cursor.execute('insert into gallery_image(id, position, title, comment, version, gallery_area_name, uploaded_image_id) values (?, ?, ?, ?, ?, ?, ?)', (id, next_pos, title, comment, 'new', area_name, uploaded_image_id))
	
	return { 'image-id': id }


def update_gallery_image(area_name, image_id, title, comment):
	if not galleryimage_exists(area_name, image_id):
		raise IntegrityError('No such image in gallery: %s, %s' % (area_name, image_id))
	
	cursor = get_connection().cursor()
	
	cursor.execute('update gallery_image set title = ?, comment = ? where gallery_area_name = ? and version = ? and id = ?', [title, comment, area_name, 'new', image_id])


def list_gallery_images(area_name, version):
	if not galleryarea_exists(area_name):
		raise IntegrityError('No such gallery: ' + area_name)
	
	cursor = get_connection().cursor()
	
	cursor.execute('select gallery_image.id, title, comment, width, height, upload_date from gallery_image, uploaded_image where gallery_area_name = ? and version = ? and gallery_image.uploaded_image_id = uploaded_image.id order by position', [area_name, version])
	
	return [{ 'image-id': image_id, 'title': title, 'comment': comment, 'width': width, 'height': height, 'upload-date': upload_date } for image_id, title, comment, width, height, upload_date in cursor.fetchall()]


def set_gallery_order(area_name, image_ids):
	if not galleryarea_exists(area_name):
		raise IntegrityError('No such gallery: ' + area_name)
	
	cursor = get_connection().cursor()
	
	cursor.execute('select gallery_image.id from gallery_image where gallery_area_name = ? and version = ?', [area_name, 'new'])
	old_ids = [i[0] for i in cursor.fetchall()]
	
	if sorted(image_ids) != sorted(old_ids):
		raise Exception('The list of new image ids is not a permutation of the list of old image ids: ' + old_ids)
	
	params = [(position, area_name, 'new', id) for position, id in zip(itertools.count(), image_ids)]
	cursor.executemany('update gallery_image set position = -1 - ? where gallery_area_name = ? and version = ? and id = ?', params) # to avoid having intermittenly two images with the same position, we first set all the position values to -1 - <position> and then flip them aftwerwards
	cursor.execute('update gallery_image set position = -1 - position where gallery_area_name = ? and version = ?', [area_name, 'new'])


def get_gallery_image(area_name, image_id):
	if not galleryimage_exists(area_name, image_id):
		raise jsonrpc.CGIRequestError('No such image in gallery: %s, %s' % (area_name, image_id))
	
	cursor = get_connection().cursor()
	
	cursor.execute('select blob from gallery_image, uploaded_image where gallery_area_name = ? and version = ? and gallery_image.id = ? and uploaded_image_id = uploaded_image.id', [area_name, 'new', image_id])
	
	return cursor.fetchone()[0]


def delete_gallery_image(area_name, image_id):
	if not galleryimage_exists(area_name, image_id):
		raise IntegrityError('No such image in gallery: %s, %s' % (area_name, image_id))
	
	cursor = get_connection().cursor()
	
	cursor.execute('delete from gallery_image where gallery_area_name = ? and version = ? and id = ?', [area_name, 'new', image_id])


def sync_gallery_area(area_name, version_to, version_from):
	cursor = get_connection().cursor()
	
	cursor.execute('delete from gallery_image where gallery_area_name = ? and version = ?', [area_name, version_to])
	cursor.execute('insert into gallery_image(id, position, title, comment, gallery_area_name, version, uploaded_image_id) select id, position, title, comment, ?, ?, uploaded_image_id from gallery_image where gallery_area_name = ? and version = ?', [area_name, version_to, area_name, version_from])


def sync_all(version_to, version_from):
	if (version_to == version_from):
		raise IntegrityError('Invalid versions: %s, %s' % (version_to, version_from))
	
	cursor = get_connection().cursor()
	
	cursor.execute('delete from text_image where version = ?', [version_to])
	cursor.execute('delete from text_area_content where version = ?', [version_to])
	cursor.execute('delete from gallery_image where version = ?', [version_to])
	
	cursor.execute('insert into text_image(id, version, text_area_name, uploaded_image_id) select id, ?, text_area_name, uploaded_image_id from text_image where version = ?', [version_to, version_from])
	cursor.execute('insert into text_area_content(text_area_name, version, content) select text_area_name, ?, content from text_area_content where version = ?', [version_to, version_from])
	cursor.execute('insert into gallery_image(id, position, title, comment, gallery_area_name, version, uploaded_image_id) select id, position, title, comment, gallery_area_name, ?, uploaded_image_id from gallery_image where version = ?', [version_to, version_from])


def cleanup_orphan_images():
	pass


