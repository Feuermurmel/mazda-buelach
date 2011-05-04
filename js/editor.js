
$(function(){
	$(".editable > img:first-child").click(callGalleryEditor);
	$(".editable > img:first-child").hover(function () {
		$(this).parent().addClass("hover");
	}, function () {
		$(this).parent().removeClass("hover");
	});
});

function setUpEditor(){
	$(".editor [name=close]").click(closeEditor);
	$(".editor [name=submit]").click(uploadImage);
}
function uploadImage(){
	var fd = new FormData();
	var xhr = new XMLHttpRequest();
	
	fd.append("file", $("[name=picture]")[0].files[0]);
	fd.append("data", $.toJSON({
		"title":$("[name=title]").val(),
		"comment":$("[name=comment]").val()
	}));
	xhr.open("POST", "/cgi-bin/request-handler.py");
	xhr.send(fd);
}

function callEditor(){
	$('.editor_popup').load('editor.html');
	/* window.open("editor.html","Editor","width=800,height=400"); */
}
function callGalleryEditor(){
	$('.editor_popup').load('gallery_editor.html');
}
function closeEditor(){
	$('.editor_popup').empty();
}