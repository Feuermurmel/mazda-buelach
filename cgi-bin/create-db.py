#! /usr/bin/env python3.2

import db

if db.exists():
	raise Exception('The database file already exists, please remove it and try again.')

with db.get_connection(True) as connection:
	cursor = connection.cursor()
	
	cursor.executescript('''
		create table text_area(
			name not null,
			primary key (name));
		create table gallery_area(
			name not null,
			primary key (name));
		create table text_area_content(
			content not null,
			version not null,
			text_area_name not null,
			foreign key (text_area_name) references text_area,
			primary key (version, text_area_name));
		create table uploaded_image(
			id integer primary key autoincrement,
			blob not null,
			width,
			height,
			upload_date);
		create table text_image(
			id not null,
			version not null,
			text_area_name not null,
			uploaded_image_id not null,
			foreign key (text_area_name) references text_area,
			foreign key (uploaded_image_id) references uploaded_image,
			primary key (id, version, text_area_name));
		create table gallery_image(
			id not null,
			position not null,
			title not null,
			comment not null,
			version not null,
			gallery_area_name not null,
			uploaded_image_id not null,
			foreign key (gallery_area_name) references gallery_area,
			foreign key (uploaded_image_id) references uploaded_image,
			primary key (gallery_area_name, id, version),
			unique (gallery_area_name, position, version));''')

