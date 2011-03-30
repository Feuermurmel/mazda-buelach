#! /usr/bin/env python3.2

import config, sqlite3

connection = sqlite3.connect(config.path_db)
cursor = connection.cursor()

cursor.executescript('''
	create table if not exists area(
		name,
		version,
		primary key (name));
	create table if not exists text_area(
		content,
		area_name,
		area_version,
		foreign key (area_name, area_version) references area (name, version),
		primary key (area_name, area_version));
	create table if not exists gallery_area(
		area_name,
		area_version,
		foreign key (area_name, area_version) references area (name, version),
		primary key (area_name, area_version));
	create table if not exists uploaded_image(
		id,
		blob,
		width,
		height,
		upload_date,
		primary key (id));
	create table if not exists text_image(
		name,
		area_name,
		area_version,
		uploaded_image_id,
		foreign key (area_name, area_version) references text_area (area_name, area_version),
		foreign key (uploaded_image_id) references uploaded_image (id),
		primary key (uploaded_image_id),
		unique (area_name, area_version, name));
	create table if not exists gallery_image(
		position,
		title,
		comment,
		area_name,
		area_version,
		uploaded_image_id,
		foreign key (area_name, area_version) references text_area (area_name, area_version),
		foreign key (uploaded_image_id) references uploaded_image (id),
		primary key (uploaded_image_id),
		unique (area_name, area_version, position));
	''')
