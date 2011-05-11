#! /usr/bin/env python3.2

import db

with db.get_connection() as connection:
	db.create_textarea('test-text')
	db.create_galleryarea('test-gallery')
