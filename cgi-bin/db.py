import config, sqlite3, decorators, os

# Constants used in the 'version' column of the 'area' table to distinguish the active from the prepared version.
version_current = 'current'
version_new = 'new'

@decorators.memoized
def get_connection(allow_empty = False):
	'Returns a single, cached connection object for the database.'
	if not allow_empty and not exists():
		raise Exception('The database has not yet been created. Please use crete-db.py to do so.')
	
	connection = sqlite3.connect(config.path_db)
	connection.cursor().execute('PRAGMA foreign_keys=ON') # make sure that foreign key constrainst are enforced by the database
	
	return connection

def exists():
	'Returns True if the database file already exists and False otherwise.'
	return os.path.exists(config.path_db)

def new_version_exists():
	cursor = get_connection()
	cursor.execute('select count(*) from area where version = ?', version_new)
	
	return cursor.fetchone()[0] > 0

# for testing:
# rm -f ../db.sqlite && ./create-db.py && ./create-test-data.py && python3.2 -c $'import db\nwith db.get_connection(): db.create_new_version()' && sqlite3 ../db.sqlite .dump
def create_new_version():
	cursor = get_connection()
	cursor.execute('insert into area (name, version) select name, ? from area', [version_new])
	cursor.execute('insert into text_area (content, area_name, area_version) select content, area_name, ? from text_area', [version_new])
	cursor.execute('insert into gallery_area (area_name, area_version) select area_name, ? from gallery_area', [version_new])
	cursor.execute('insert into text_image (name, area_name, area_version, uploaded_image_id) select name, area_name, ?, uploaded_image_id from text_image', [version_new])
	cursor.execute('insert into gallery_image (position, title, comment, area_name, area_version, uploaded_image_id) select position, title, comment, area_name, ?, uploaded_image_id from gallery_image', [version_new])


