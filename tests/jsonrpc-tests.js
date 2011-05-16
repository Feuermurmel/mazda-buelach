
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
					}, success, failure);
				}, function (msg) {
					failure(msg);
				});
			}
		},
		{
			'name': 'upload images',
			'test': function (success, failure) {
				async.map(['foo', 'bar', 'baz'], function (v, success, failure) {
				//	message('Uploading ' + v + ' ...')
					rpc.upload_gallery_image(testImage, testGalleryArea, v + ' title', v + ' comment', function (v) {
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
			'name': 'list images',
			'test': function (success, failure) {
				rpc.list_gallery_images(testGalleryArea, function (v) {
					message('Got image list: ' + $.toJSON(v))
					success();
				}, failure);;
			}
		},
		{
			'name': 'request images',
			'test': function (success, failure) {
				console.log(imageIds)
				async.map(imageIds, function (v, success, failure) {
					rpc.get_image(v, function (vData) {
						message('Got image: ' + v);
						success();
					}, failure);
				}, success, failure);
			}
		},
		{
			'name': 'set image order',
			'test': function (success, failure) {
				// reverse the images in the gallery and test their order
				imageIds.reverse()
								
				rpc.set_gallery_order(testGalleryArea, imageIds, function () {
					rpc.get_image_list(testGalleryArea, function (vList) {
						var res = vList.every(function (v, k) {
							return v['image-id'] == imageIds[k];
						});
						
						if (res)
							success();
						else
							failure();
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
	'upload_gallery_image': function (image, area_name, title, comment, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'upload-gallery-image',
			'image': image,
			'area-name': area_name,
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
	'get_image': function (image_id, success, failure) {
		var image = new Image();
		
		$(image).load(function () {
			success(image);
		});
		
		$(image).error(function () {
			failure('bäääh!');
		});
		
		request = {
			'action': 'get-image',
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


