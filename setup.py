from distutils.core import setup
# import py2exe

import os
import glob

import flask.ext.socketio
import eventlet
import engineio
from flask.ext.socketio import SocketIO, emit
# from vjoy.VirtualJoystick import *

from esky import bdist_esky
from esky.bdist_esky import Executable  

executables = [Executable('main.py', icon='favicon.ico',)]

freezer_opts = dict(
	# optimize=0,
	# compressed=1,
	# optimize=2,
	# bundle_files=1,
	# bundle_files=2,
	# bundle_files=3,
	packages=['vjoy', 'engineio'],
	includes=[
		# 'vjoy',
		'Queue',
		'eventlet',
		# 'Flask-SocketIO',
		# 'flask.ext.socketio',
		'flask_socketio',
	],
	excludes=[
		"pywin", "pywin.debugger", "pywin.debugger.dbgcon",
		"pywin.dialogs", "pywin.dialogs.list", "pydoc", "pydoc_data"
		"Tkconstants","Tkinter","tcl", "_ssl"
	],
)

vjoy_files = ['vjoy\\vJoyInterface.dll']
vjoy_files += glob.glob('./vjoy/*.pyd')


esky_opts = {
	"freezer_module":"cxfreeze", 
	'excludes':['tkinter', 'tcl'],
	'freezer_options': freezer_opts,
	# 'compress': 'ZIP',
	}

setup(
	name='vjoy',
	# console=['main.py'],
	version=open('version.txt').read(),
	scripts=executables,
	data_files=[
		('.', vjoy_files),
		# ('.', ['index.html']),
		# ('.', glob.glob('./static/*'))
		('./app', [
			'favicon.ico',
			'icon.svg',
			'index.build.html',
			'index.build.js',
			'manifest.appcache',
			'manifest.json',
		]),
	],
	zipfile=None,
	options={
	# 'py2exe': freezer_opts, 
	"bdist_esky": esky_opts
	}
)