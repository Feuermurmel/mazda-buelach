lambda = {
	type: function (val) {
		if ($.isFunction(val))
			return "function";
		else if ($.isArray(val))
			return "array";
		else if (val === null)
			return "null";
		else
			return typeof val;
	},
	keys: function (obj) {
		var res = [];
		
		lambda.map(obj, function (k, v) {
			res.push(k);
		});
		
		return res;
	},
	values: function (obj) {
		var res = [];
		
		lambda.map(obj, function (k, v) {
			res.push(v);
		});
		
		return res;
	},
	// Compare two objects in depth.
	equals: function (obj1, obj2) {
		var type1 = lambda.type(obj1);
		
		if (type1 != lambda.type(obj2))
			return false;
		
		if (type1 == "array") {
			if (obj1.length != obj2.length)
				return false;
			
			return obj1.every(function (v, i) {
				return lambda.equals(v, obj2[i]);
			});
		} else if (type1 == "object") {
			var keys1 = lambda.keys(obj1).sort();
			
			if (!lambda.equals(keys1, lambda.keys(obj2).sort()))
				return false;
			
			return keys1.every(function (v) {
				return lambda.equals(obj1[v], obj2[v]);
			});
		} else {
			return obj1 === obj2;
		};
	},
	range: function (min, max) {
		var res = [];
		
		if (max === undefined) {
			max = min;
			min = 0;
		}
		
		for (var i = min; i < max; i += 1)
			res.push(i);
		
		return res;
	},
	constant: function (v) {
		return function () {
			return v;
		};
	},
	identity: function (v) {
		return v;
	},
	object: function (O, C) {
		var F = function () { };
		F.prototype = O;
		var I = F();
		lambda.map(C, function (k, v) { I[k] = v; });
		return I;
	},
	// map over object properties
	map: function (obj, fn) {
		var res = { };
		
		for (i in obj)
			if (obj.hasOwnProperty(i))
				res[i] = fn(i, obj[i]);
		
		return res;
	},
	filter: function (obj, fn) {
		var res = { };
		
		for (i in obj)
			if (obj.hasOwnProperty(i))
				if (fn(i, obj[i]))
					res[i] = obj[i];
		
		return res;
	}
}
