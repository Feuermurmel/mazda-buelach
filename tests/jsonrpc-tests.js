
function makeTests(testImage) {
	var testGalleryArea = 'test-gallery'
	var imageIds = null;

	return [
		{
			'name': 'remove all gallery images',
			'test': function (success, failure) {
				rpc.list_gallery_images(testGalleryArea, function (vImages) {
					async.map(vImages, function (vImage, success, failure) {
						message('Deleting image: ' + vImage['image-id'])
						rpc.delete_gallery_image(testGalleryArea, vImage['image-id'], success, failure);
					}, function () {
						rpc.list_gallery_images(testGalleryArea, function (v) {
							check(v.length == 0, 'image list not empty', success, failure);
						}, failure);
					}, failure);
				}, failure);
			}
		},
		{
			'name': 'upload gallery images',
			'test': function (success, failure) {
				async.map(['foo', 'bar', 'baz'], function (v, success, failure) {
					rpc.upload_gallery_image(testGalleryArea, testImage, v + ' title', v + ' comment', function (v) {
						message('Got image-id: ' + v['image-id'])
						success(v['image-id']);
					}, failure);
				}, function (res) {
					imageIds = res;
					success();
				}, failure);
			}
		},
		{
			'name': 'list gallery images',
			'test': function (success, failure) {
				rpc.list_gallery_images(testGalleryArea, function (v) {
					message('Got image list: ' + $.toJSON(v))
					success();
				}, failure);
			}
		},
		{
			'name': 'request gallery images',
			'test': function (success, failure) {
				async.map(imageIds, function (v, success, failure) {
					rpc.get_gallery_image(testGalleryArea, v, function (vData) {
						message('Got image: ' + v);
						success();
					}, failure);
				}, success, failure);
			}
		},
		{
			'name': 'update gallery images',
			'test': function (success, failure) {
				var newTitle = 'new title';
				var newComment = 'new comment';
				
				async.map(imageIds, function (v, success, failure) {
					rpc.update_gallery_image(testGalleryArea, v, newTitle, newComment, function (vData) {
						message('Updated image: ' + v);
						success();
					}, failure);
				}, function () {
					rpc.list_gallery_images(testGalleryArea, function (v) {
						message('Got image list: ' + $.toJSON(v));
						
						var res = v.every(function (v, k) {
							return v['title'] == newTitle && v['comment'] == newComment;
						});
						
						check(res, 'new titles or comments do not match', success, failure);
					}, failure);
				}, failure);
			}
		},
		{
			'name': 'set gallery image order',
			'test': function (success, failure) {
				// reverse the images in the gallery and test their order
				imageIds.reverse()
								
				rpc.set_gallery_order(testGalleryArea, imageIds, function () {
					rpc.list_gallery_images(testGalleryArea, function (vList) {
						message('Got image list: ' + $.toJSON(vList));
						
						var res = vList.every(function (v, k) {
							return v['image-id'] == imageIds[k];
						});
						
						check(res, 'new image ids do not match', success, failure);
					}, failure);
				}, failure);
			}
		}
	]
}

function runTests(tests) {
	$('#results').empty();
	
	async.map(tests, function (v, success, failure) {
		message("Test: " + v.name, 'title');
		
		v.test(function (res) {
			message('Test passed', 'success');
			success();
		}, function (msg) {
			message('Test failed: ' + msg, 'failure');
			failure();
		});
	}, function (res) {
		message('Test Summary:', 'title');
		message('All tests passed', 'success');
	}, function (msg) {
		message('Test Summary:', 'title');
		message('Some tests failed', 'failure');
	});
}

function check(value, msg, success, failure) {
	if (value) {
		success();
	} else {
		message('Assertion failed: ' + msg, 'failure');
		failure('assertion failure');
	}
}

function message(text, type) {
	if (type === undefined)
		type = 'message';
	
	var elems = text.split('\n').map(function (i) {
		return dom.element('p', { }, [dom.text(i.replace(' ', '\xa0').replace('\t', '\xa0\xa0\xa0\xa0'))])
	});
	
	$('#results').append(dom.element('p', { 'class': type }, elems));
	
	$('body').scrollTop($('body').height());
}

var handlerURL = '../cgi-bin/request-handler.py'

var rpc = {
	'upload_gallery_image': function (area_name, image, title, comment, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'upload-gallery-image',
			'area-name': area_name,
			'image': image,
			'title': title,
			'comment': comment
		}, success, failure);
	},
	'update_gallery_image': function (area_name, image_id, title, comment, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'update-gallery-image',
			'area-name': area_name,
			'image-id': image_id,
			'title': title,
			'comment': comment
		}, success, failure);
	},
	'list_gallery_images': function (area_name, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'list-gallery-images',
			'area-name': area_name
		}, success, failure);
	},
	'get_gallery_image': function (area_name, image_id, success, failure) {
		var image = new Image();
		
		$(image).load(function () { success(image); });
		
		$(image).error(function () { failure('bäääh!'); });
		
		request = {
			'action': 'get-gallery-image',
			'area-name': area_name,
			'image-id': image_id
		};
		
		image.src = handlerURL + '?' + $.toJSON(request);
	},
	'get_text_image': function (area_name, image_id, success, failure) {
		var image = new Image();
		
		$(image).load(function () { success(image); });
		
		$(image).error(function () { failure('bäääh!'); });
		
		request = {
			'action': 'get-text-image',
			'area-name': area_name,
			'image-id': image_id
		};
		
		image.src = handlerURL + '?' + $.toJSON(request);
	},
	'set_gallery_order': function (area_name, image_ids, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'set-gallery-order',
			'area-name': area_name,
			'image-ids': image_ids
		}, success, failure);
	},
	'delete_gallery_image': function (area_name, image_id, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'delete-gallery-image',
			'area-name': area_name,
			'image-id': image_id
		}, success, failure);
	}
}

