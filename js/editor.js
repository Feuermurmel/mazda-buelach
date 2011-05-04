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

function setUpEditor(type){
	$(".editor [name=close]").click(closeEditor);
	
	if(type === "gallery")
	{
		$(".text-editor").hide();
		$(".editor [name=submit]").click(uploadImage);
		showGallery();
		
	}
	else if(type === "text")
	{
		$(".gallery-editor").hide();
		$('.gallery').append("Texteditor");
	}
}
function uploadImage(){
	var fd = new FormData();
	var xhr = new XMLHttpRequest();
	
	data = {
		"title":$("[name=title]").val(),
		"comment":$("[name=comment]").val()
	};
	
	fd.append("file", $("[name=picture]")[0].files[0]);

	xhr.addEventListener("load", function (evt) {
		console.log(evt.target.responseText);
	}, false);
	xhr.addEventListener("error", function (evt) {
		console.log(evt.target.responseText);
	}, false);
	
	xhr.open("POST", "cgi-bin/request-handler.py?" + $.toJSON(data));
	xhr.send(fd);
}

function callEditor(type){
	$('.editor_popup').load('editor.html', function() { setUpEditor(type);});
	/* window.open("editor.html","Editor","width=800,height=400"); */
}
function closeEditor(){
	$('.editor_popup').empty();
}
function showGallery() {
	$('.gallery').append("Welt");
	// Mit remove Divs herausnehmen und clone und sovielmal einfügen wie man es braucht
}