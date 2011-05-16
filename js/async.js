async = (function () {
	function range(num) {
		var res = [];
		
		for (var i = 0; i < num; i += 1)
			res.push(i);
		
		return res;
	};
	
	return {
		// fn will be called with each element in list as the first argument and a success and failure handler the second and third argument. When the success handler has been called for each invocation of fn, success will be called with a list of the arguments to the success handler. When the failure handler is called failure will be called with its argument and success won't get called.
		"pmap": function (list, fn, success, failure) {
			var failed = false;
			var numLeft = list.length;
			var results = [];
			
			range(numLeft).map(function (k) {
				fn(list[k], function (v) {
					numLeft -= 1;
					results[k] = v;
					
					if (numLeft == 0)
						success(results);
				}, function (msg) {
					if (!failed)
						failure(msg);
					
					failed = true;
				});
			});
			
			if (list.length == 0)
				success(results);
		},
		"map": function (list, fn, success, failure) {
			var length = list.length;
			var result = [];
			
			function run(i) {
				if (i < length) {
					fn(list[i], function (res) {
						result.push(res);
						run(i + 1);
					}, failure);
				} else {
					success(result);
				}
			}
			
			run(0);
		}
		// The first element in list will be called with v as the first argument and success and failure handlers as second and third argument. When the called function calls the success handler, the next function in the list will be called with the arguments to the success handler.
	/*	"compose": function (v, list, success, failure) {
			var failed = false;
			var numLeft = list.length;
			var results = [];
			
			range(numLeft).map(function (k) {
				fn(list[k], function (v) {
					numLeft -= 1;
					results[k] = v;
					
					if (numLeft == 0)
						success(results);
				}, function (msg) {
					if (!failed)
						failure(list[k], msg);
					
					failed = true;
				});
			});
		} */
	};
}) ();
