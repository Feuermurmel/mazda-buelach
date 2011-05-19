
function makeTests(testImage) {
	var testGalleryArea = 'test-gallery'
	var testTextArea = 'test-text'
	var testContent = 'foo bar baz'
	var imageIds = null;

	return [
		// Gallery area tests
		{			
			'name': 'upload gallery images',
			'test': function (success, failure) {
				rpc.list_gallery_images(testGalleryArea, function (vImages) {
					async.map(vImages, function (vImage, success, failure) {
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
				rpc.list_gallery_images(testGalleryArea, success, failure);
			}
		},
		{
			'name': 'request gallery images',
			'test': function (success, failure) {
				async.map(imageIds, function (v, success, failure) {
					rpc.get_gallery_image(testGalleryArea, v, success, failure);
				}, success, failure);
			}
		},
		{
			'name': 'update gallery images',
			'test': function (success, failure) {
				var newTitle = 'new title';
				var newComment = 'new comment';
				
				async.map(imageIds, function (v, success, failure) {
					rpc.update_gallery_image(testGalleryArea, v, newTitle, newComment, success, failure);
				}, function () {
					rpc.list_gallery_images(testGalleryArea, function (v) {
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
						var res = vList.every(function (v, k) {
							return v['image-id'] == imageIds[k];
						});
						
						check(res, 'new image ids do not match', success, failure);
					}, failure);
				}, failure);
			}
		},
		// Text area tests
		{
			'name': 'remove all text area images',
			'test': function (success, failure) {
				rpc.list_text_images(testTextArea, function (vImages) {
					async.map(vImages, function (vImage, success, failure) {
						rpc.delete_text_image(testTextArea, vImage['image-id'], success, failure);
					}, function () {
						rpc.list_text_images(testTextArea, function (v) {
							check(v.length == 0, 'image list not empty', success, failure);
						}, failure);
					}, failure);
				}, failure);
			}
		},
		{
			'name': 'upload text area images',
			'test': function (success, failure) {
				async.map(['foo', 'bar', 'baz'], function (v, success, failure) {
					rpc.upload_text_image(testTextArea, testImage, success, failure);
				}, function (res) {
					imageIds = res.map(function (v) {
						return v['image-id'];
					});
					success();
				}, failure);
			}
		},
		{
			'name': 'list text area images',
			'test': function (success, failure) {
				rpc.list_text_images(testTextArea, success, failure);
			}
		},
		{
			'name': 'request text area images',
			'test': function (success, failure) {
				async.map(imageIds, function (v, success, failure) {
					rpc.get_text_image(testTextArea, v, success, failure);
				}, success, failure);
			}
		},
		// Text area content
		{
			'name': 'get text area content',
			'test': function (success, failure) {
				rpc.get_text_content(testTextArea, success, failure);
			}
		},
		{
			'name': 'set text area content',
			'test': function (success, failure) {
				rpc.update_text_content(testTextArea, testContent, function (vData) {
					rpc.get_text_content(testTextArea, function (v) {
						check(v.content == testContent, 'content does not match!', success, failure);
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

function rpcMessage(data) {
	var args = [];
	
	lambda.map(data, function (k, v) {
		if (k != 'action')
			args.push(k + ' = ' + $.toJSON(v));
	});
	
	message(data['action'] + '(' + args.join(', ') + ')');
}

// redefining jsonrpc to output a message for each request
var jsonrpc = (function (jsonrpc) {
	return function (url, data, success, failure) {
		rpcMessage(data);
		jsonrpc(url, data, success, failure);
	}
}) (jsonrpc)

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
	'set_gallery_order': function (area_name, image_ids, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'set-gallery-order',
			'area-name': area_name,
			'image-ids': image_ids
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
		
		rpcMessage(request);
		image.src = handlerURL + '?' + $.toJSON(request);
	},
	'delete_gallery_image': function (area_name, image_id, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'delete-gallery-image',
			'area-name': area_name,
			'image-id': image_id
		}, success, failure);
	},
	'upload_text_image': function (area_name, image, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'upload-text-image',
			'area-name': area_name,
			'image': image
		}, success, failure);
	},
	'list_text_images': function (area_name, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'list-text-images',
			'area-name': area_name
		}, success, failure);
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
		
		rpcMessage(request);
		image.src = handlerURL + '?' + $.toJSON(request);
	},
	'delete_text_image': function (area_name, image_id, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'delete-text-image',
			'area-name': area_name,
			'image-id': image_id
		}, success, failure);
	},
	'get_text_content': function (area_name, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'get-text-content',
			'area-name': area_name
		}, success, failure);
	},
	'update_text_content': function (area_name, content, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'update-text-content',
			'area-name': area_name,
			'content': content
		}, success, failure);
	}
}


