#! /usr/bin/env python3.2

import db

with db.get_connection() as connection:
	cursor = connection.cursor()
	
	area_name = "news"
	area_content = "Der neue Mazda RX-8 mit siiieeebenhundert PS!!!"
	
	cursor.execute("insert into area (name, version) values (?, ?)", (area_name, db.version_current))
	cursor.execute("insert into text_area (content, area_name, area_version) values (?, ?, ?)", (area_content, area_name, db.version_current))
