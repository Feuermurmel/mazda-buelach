#! /usr/bin/env python3.2

import db

if db.exists():
	raise Exception('The database file already exists, please remove it and try again.')

with db.get_connection(True) as connection:
	cursor = connection.cursor()
	
	cursor.executescript('''
		create table area(
			name,
			version,
			primary key (name, version));
		create table text_area(
			area_name,
			area_version,
			content,
			foreign key (area_name, area_version) references area (name, version),
			primary key (area_name, area_version));
		create table gallery_area(
			area_name,
			area_version,
			foreign key (area_name, area_version) references area (name, version),
			primary key (area_name, area_version));
		create table uploaded_image(
			id,
			blob,
			width,
			height,
			upload_date,
			primary key (id));
		create table text_image(
			name,
			area_name,
			area_version,
			uploaded_image_id,
			foreign key (area_name, area_version) references text_area (area_name, area_version),
			foreign key (uploaded_image_id) references uploaded_image (id),
			primary key (uploaded_image_id),
			unique (area_name, area_version, name));
		create table gallery_image(
			position,
			title,
			comment,
			area_name,
			area_version,
			uploaded_image_id,
			foreign key (area_name, area_version) references text_area (area_name, area_version),
			foreign key (uploaded_image_id) references uploaded_image (id),
			primary key (uploaded_image_id),
			unique (area_name, area_version, position));''')

