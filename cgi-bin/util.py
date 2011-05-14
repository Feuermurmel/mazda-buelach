import os
from os import path


# from http://wiki.python.org/moin/PythonDecoratorLibrary#Memoize
class memorized(object):
	"Decorator that caches a function's return value each time it is called. If called later with the same arguments, the cached value is returned, and not re-evaluated."
	def __init__(self, func):
		self.func = func
		self.cache = {}
	def __call__(self, *args):
		try:
			return self.cache[args]
		except KeyError:
			value = self.func(*args)
			self.cache[args] = value
			return value
		except TypeError:
			# uncachable -- for instance, passing a list as an argument.
			# Better to not cache than to blow up entirely.
			return self.func(*args)
	def __repr__(self):
		"Return the function's docstring."
		return self.func.__doc__
	def __get__(self, obj, objtype):
		"Support instance methods."
		return functools.partial(self.__call__, obj)


# from http://wiki.python.org/moin/PythonDecoratorLibrary#Creating_Well-Behaved_Decorators_.2BAC8_.22Decorator_decorator.22
def decorator(decorator):
	"""This decorator can be used to turn simple functions 	into well-behaved decorators, so long as the decorators are fairly simple. If a decorator expects a function and returns a function (no descriptors), and if it doesn't modify function attributes or docstring, then it is eligible to use this. Simply apply @simple_decorator to your decorator and it will automatically preserve the docstring and function attributes of functions to which it is applied."""

	def new_decorator(f):
		g = decorator(f)
		
		def get(self, obj, objtype):
			return functools.partial(g, obj)
		
		g.__name__ = f.__name__
		g.__doc__ = f.__doc__
		g.__get__ = get
		g.__dict__.update(f.__dict__)
		
		return g
	
	# Now a few lines needed to make simple_decorator itself
	# be a well-behaved decorator.
	new_decorator.__name__ = decorator.__name__
	new_decorator.__doc__ = decorator.__doc__
	new_decorator.__dict__.update(decorator.__dict__)
	
	return new_decorator


# creates a file without overwriting an already existing one
def safe_create_file(path, mode):
	fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL)
	file = os.fdopen(fd, mode)
	
	return file


# write the contents of a string to a file
def write_file(fpath, content, overwrite = False, create_dir = True, encoding = 'utf-8'):
	if create_dir:
		os.makedirs(path.dirname(fpath), exist_ok = True)
	
	if overwrite:
		file = open(fpath, 'wb')
	else:
		file = safe_create_file(fpath, 'wb')
	
	with file:
		file.write(content.encode(encoding))


# read the contents of a file and return it as a string
def read_file(path, encoding = 'utf-8'):
	with open(path, 'rb') as file:
		return file.read().decode(encoding)
