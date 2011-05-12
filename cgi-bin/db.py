import os, stat, time, datetime, sqlite3, config, util


# Constants used in the 'version' column of the 'area' table to distinguish the active from the prepared version.
version_current = 'current'
version_new = 'new'


@util.memorized
def get_connection(allow_empty = False):
	'Returns a single, cached connection object for the database.'
	if not exists():
		if not allow_empty:
			raise Exception('The database has not yet been created. Please use crete-db.py to do so.')
		
		# Create an empty, world-read-and-writable file
		# TODO: is this a good idea
		with open(config.paths.db, 'wb'): pass
		os.chmod(config.paths.db, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IWGRP | stat.S_IROTH | stat.S_IWOTH)
	
	connection = sqlite3.connect(config.paths.db)
	connection.cursor().execute('PRAGMA foreign_keys=ON') # make sure that foreign key constrainst are enforced by the database
	
	return connection


def exists():
	'Returns True if the database file already exists and False otherwise.'
	return os.path.exists(config.paths.db)


def create_textarea(name):
	cursor = get_connection().cursor()
	
	# TODO: don't fail, if the text_area already exists
#	cursor.execute('select from test_area')
	
	cursor.execute('insert into area(name, version) values (?, ?)', [name, 'new'])
	cursor.execute('insert into text_area(area_name, area_version, content) values (?, ?, ?)', [name, 'new', ''])


def get_textarea(name, version):
	cursor = get_connection().cursor()
	cursor.execute('select content from text_area where area_name = ? and area_version = ?', [name, version])
	
	return cursor.fetchone()[0]


def create_galleryarea(name):
	cursor = get_connection().cursor()
	
	# TODO: don't fail, if the text_area already exists
#	cursor.execute('select from test_area')
	
	cursor.execute('insert into area(name, version) values (?, ?)', [name, 'new'])
	cursor.execute('insert into gallery_area(area_name, area_version) values (?, ?)', [name, 'new'])


def get_gallery_images(area_name):
	cursor = get_connection().cursor()
	
	cursor.execute('select id, title, comment, width, height, upload_date from gallery_image, uploaded_image where area_name = ? and gallery_image.uploaded_image_id = uploaded_image.id order by position', [area_name])
	
	return [{ 'id': id, 'title': title, 'comment': comment, 'width': width, 'height': height, 'upload-date': upload_date } for id, title, comment, width, height, upload_date in cursor.fetchall()]


def add_gallery_image(area_name, filename, blob, width, height, title, comment):
	cursor = get_connection().cursor()
	counter = 1
	upload_date = time.mktime(datetime.datetime.now().timetuple())
	
	while True:
		if counter < 2:
			id = filename
		else:
			id = '%s_%s' % (filename, counter)
		
		cursor.execute('select count(*) from uploaded_image where id = ?', [id])
		
		if cursor.fetchone()[0] == 0:
			break
		
		counter += 1
	
	cursor.execute('select max(position) from gallery_image where area_name = ? and area_version = ?', [area_name, 'new'])
	next_pos = cursor.fetchone()[0]
	
	data = {
		'area_name': area_name,
		'area_name_': area_name, # Python's sqlite3 interface does not allow using a given named parameter multiple times in the query
		'area_version': 'new',
		'area_version_': 'new',
		'id': id,
		'id_': id,
		'blob': blob,
		'width': width,
		'height': height,
		'upload_date': upload_date,
		'title': title,
		'comment': comment,
		'position': 0 if next_pos is None else next_pos + 1
	}
	
	cursor.execute('insert into uploaded_image(id, blob, width, height, upload_date) values (:id, :blob, :width, :height, :upload_date)', data)
	cursor.execute('insert into gallery_image(position, title, comment, area_name, area_version, uploaded_image_id) values (:position, :title, :comment, :area_name_, :area_version_, :id_)', data)
	
	return id


def get_image(id):
	cursor = get_connection().cursor()
	
	cursor.execute('select blob from uploaded_image where id = ?', [id])
	
	return cursor.fetchone()[0]


def update_textarea(name, content):
	cursor = get_connection().cursor()
	cursor.execute('update text_area set content = ? where area_name = ? and area_version = ?', [content, name, 'new'])
	
	return cursor.fetchone()[0]


def add_image(name, version = None):
	'Adds an image for the specified '
	cursor = get_connection().cursor()
	cursor.execute('select content from text_area where area_name = ?', [name])
	
	return cursor.fetchone()[0]


#def create_new_version():
#	cursor = get_connection()
#	cursor.execute('insert into area (name, version) select name, ? from area', [version_new])
#	cursor.execute('insert into text_area (content, area_name, area_version) select content, area_name, ? from text_area', [version_new])
#	cursor.execute('insert into gallery_area (area_name, area_version) select area_name, ? from gallery_area', [version_new])
#	cursor.execute('insert into text_image (name, area_name, area_version, uploaded_image_id) select name, area_name, ?, uploaded_image_id from text_image', [version_new])
#	cursor.execute('insert into gallery_image (position, title, comment, area_name, area_version, uploaded_image_id) select position, title, comment, area_name, ?, uploaded_image_id from gallery_image', [version_new])



