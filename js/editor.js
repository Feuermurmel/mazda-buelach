$(function(){
	$.ajaxSetup ({
	    // Disable caching of AJAX responses
	    cache: false
	});
	$(".editable.editor-gallery > img:first-child").click(function() { callEditor("gallery"); });
	$(".editable.editor-text > img:first-child").click(function() { callEditor("text"); });
	$(".editable > img:first-child").hover(function () {
		$(this).parent().addClass("hover");
		}, function () {
		$(this).parent().removeClass("hover");
	});
	
});

function callEditor(type){
	$('.editor_popup').load('editor.html', function() { setUpEditor(type);});
}

function setUpEditor(type){
	
	// Funktionen für die Gallery
	function uploadGalleryImage() {
		var file = $(".gallery-editor [name=picture]")[0].files[0];
		if (file === undefined) {
			alert('Please select a file.');
			return
		}
		data = {
			'action': 'upload-gallery-image',
			'area-name': areaName,
			'title':$(".gallery-editor [name=title]").val(),
			'comment':$(".gallery-editor [name=comment]").val(),
			'image':file
		};
		jsonrpc(handlerURL, data, showGallery, function () { alert("Bild hochladen Fehlgeschlagen") });
	}
	function showGallery() {
		$('.gallery-content').empty();
		req = {
			'action': 'list-gallery-images',
			'area-name': areaName
		}
		jsonrpc(handlerURL, req, function(imageList) {
			for(i = 0; i < imageList.length ; i++)
			{
				divToFill = divToClone.clone();
				var image = new Image();
				req = {
					'action': 'get-gallery-image',
					'area-name': areaName,
					'image-id': imageList[i]['image-id']
				}
				
				image.src = handlerURL + '?' + $.toJSON(req);
				$(image).width('100px');
				$(image).height('100px');
				
				$('.image', divToFill).append(image);
				$('.title', divToFill).append(imageList[i]['title']);
				$('.comment', divToFill).append(imageList[i]['comment']);
				$('.gallery-content').append(divToFill);
				
				// Eventhandler für löschen und bearbeiten für jedes bild hier einfügen
				// Ein alert ausgeben
			}
		}, function() { alert("fehler");}
		);
	}
	// ------------------------------------------------------
	
	// Funktionen für den Texteditor
	function uploadTextImage() {
		var file = $(".text-editor [name=upload-text-picture]")[0].files[0];
		jsonrpc(handlerURL, {
			'action': 'upload-text-image',
			'area-name': areaName,
			'image': file
		}, loadImageList, function() { alert("fehler");}
		);
	}
	function deleteTextImage () {
		image_id = $(".editor [name=text-editor-img-list]")[0].value;
		alert(image_id);
		jsonrpc(handlerURL, {
			'action': 'delete-text-image',
			'area-name': areaName,
			'image-id': image_id
		}, loadImageList, function() { alert("fehler"); }
		);
	}
	function insertImageInText() {
		textarea = $(".editor [name=editor-textarea]")   
		str = textarea[0].value;  // Text aus Textarea auslesen und in str speichern
		imgString = "![Alt text](/path/to/" + $(".editor [name=text-editor-img-list]")[0].value + ")";  // Bild String zusammensetzten
		pos = textarea[0].selectionStart;  // position des Cursors herausfinden
		str = str.slice(0, pos) + imgString + str.slice(pos); // Bild String in Text einsetzen
		textarea[0].value = str;  // String in der Textarea einsetzten
		textarea[0].setSelectionRange(pos + imgString.length , pos + imgString.length);  // Cursor hinter dem Bild setzten
	}
	function loadTextInTextbox () {
		textarea = $(".editor [name=editor-textarea]") 
		jsonrpc(handlerURL, {
			'action': 'get-text-content',
			'area-name': areaName
		}, function (res) {
			textarea[0].value = res.content;
		}, function() {
			textarea[0].value = "Text konnte nicht geladen werden !!";
		}
		);
	}
	function saveText () {
		textarea = $(".editor [name=editor-textarea]");
		text = textarea[0].value;
		jsonrpc(handlerURL, {
			'action': 'update-text-content',
			'area-name': areaName,
			'content': text	
		}, function() { alert("Text hochgeladen") }, function() { alert("Text hochladen fehlgeschlagen") }
		);
	}
	function loadImageList () {
		var imageListElem = $(".editor [name=text-editor-img-list]")[0];
		jsonrpc(handlerURL, {
			'action': 'list-text-images',
			'area-name': areaName
			}, function(imageList) {
			imageListElem.length = null;
			for(i = 0; i < imageList.length ; i++)
			{
				imageListElem.options[imageListElem.length] = new Option(imageList[i]['image-id'], imageList[i]['image-id'], false, false);
			}
		}, function () { alert("fehler");}
		);
	}
	// ---------------------------------------
	
	function closeEditor(){
		$('.editor_popup').empty();
	}
	
	// -----------------------------------------------------------------
	// Variabeln
	var areaName = $(".editable").attr("areaname");
	var handlerURL = 'cgi-bin/request-handler.py'
	
	
	// -----------------------------------------------------------------
	// Set Up Editor
	$(".editor > .header > .editor-schliessen-img").click(closeEditor);
	if(type === "gallery")
	{
		$(".text-editor").hide();
		var divToClone = $('.gallery-content > .image-with-all');
		$('.gallery-content > .image-with-all').remove();
		$(".editor [name=submit]").click(uploadGalleryImage);
		showGallery();
	}
	else if(type === "text")
	{
		$(".gallery-editor").hide();
		loadTextInTextbox();
		loadImageList();
		$(".editor [name=save-text]").click(saveText);
		$(".editor [name=picture-insert]").click(insertImageInText);
		$(".editor [name=upload-text-picture]").change(uploadTextImage);
		$(".editor [name=picture-remove]").click(deleteTextImage);
	}
}