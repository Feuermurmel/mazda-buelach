import config, sqlite3, decorators, os

@decorators.memoized
def get_connection(allow_empty = False):
	'Returns a single, cached connection object for the database.'
	if not allow_empty and not exists():
		raise Exception('The database has not yet been created. Please use crete-db.py to do so.')
	
	return sqlite3.connect(config.path_db)

def exists():
	'Returns True if the database file already exists and False otherwise.'
	return os.path.exists(config.path_db)
