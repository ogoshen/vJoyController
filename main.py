from flask import Flask, send_from_directory, send_file
from flask import make_response
from flask.ext.socketio import SocketIO, emit
from vjoy.vJoyInterface import vJoyInterface, VjdStat, Axis
from vjoy.VirtualJoystick import *
import eventlet
import math
import time
import esky
import sys

VERSION="0.0.1"

if getattr(sys, "frozen", False):
    # app = esky.Esky(sys.executable,"https://example-app.com/downloads/")
    # app = esky.Esky(sys.executable, "http://localhost:8000")
    app = esky.Esky(sys.executable, "http://127.0.0.1:80")
    try:
        app.auto_update()
    except Exception as e:
        print ("ERROR UPDATING APP:", e)

j = None


# app = Flask(__name__, static_url_path='/', static_folder='./static')
if getattr(sys, "frozen", False):
	app = Flask(__name__, static_url_path='/', static_folder='./app')
	app.debug = False
else:
	app = Flask(__name__)
	app.debug = True

socketio = SocketIO(app, logger=False, threaded=True)
# import sys
# sys.exit(0)


@socketio.on('joystick')
def joystick(axes):
	global j
	# print axes, time.time()
	for a in axes:
		axis, value = a['axis'], a['value']
		v = int(value)
		if v >= 0:
			j.axe[axis].value = v
			# eventlet.spawn_n(setattr, j.axe[axis], 'value', v)
			# v = int(v)

	# ax = [a['axis'] for a in axes]
	# vx, vy = j.axe[ax[0]].value, j.axe[ax[1]].value
	# vx, vy = map(lambda x: float(2*x)/0x8000 - 1.0, [vx, vy])
	# if vx == 0 and vy == 0:
	# 	v = -1
	# else:
	# 	v = math.atan2(vy, vx)
	# 	v /= 2*math.pi	
	# 	v = v * 35999
	# 	v = (v + 35999/4) % 35999
	# 	v = int(v)
	# vJoyInterface.SetContPov(v, j.vjoyId, 1)
	# vJoyInterface.SetContPov(v, j.vjoyId, 2)
	# vJoyInterface.SetContPov(v, j.vjoyId, 3)
	# vJoyInterface.SetContPov(v, j.vjoyId, 4)
		
		# print j.axe[axis]
		# emit('joystick', {'result': 'OK', 'joy': str(j), 'msg': msg})
	# return ', '.join(map(str, [vx, vy, v]))


@socketio.on('joystick dpad')
def joystick_button(value):
	global j
	if vJoyInterface.GetVJDContPovNumber(j.vjoyId) > 0:
		v = int(value)
		vJoyInterface.SetContPov(v, j.vjoyId, 1)
	# vJoyInterface.SetContPov(v, j.vjoyId, 2)
	# vJoyInterface.SetContPov(v, j.vjoyId, 3)
	# vJoyInterface.SetContPov(v, j.vjoyId, 4)

@socketio.on('joystick button')
def joystick_button(button, value):
	global j
	if button < len(j.button):
		j.button[button].pressed = bool(value)


@socketio.on('connect')
def test_connect():
	# emit('my response', {'data': 'Connected'})
	vJoyInterface.ResetAll()
	global j
	try:
		j = j or VirtualJoystick(1)
		vJoyInterface.ResetVJD(j.vjoyId)
	except Exception, e:
		raise e
		# print e

@socketio.on('disconnect')
def test_disconnect():
	print('Client disconnected')

# @app.route("/")
# def index():
# 	return open("index.html").read()
# 	# return send_from_directory('app', 'index.build.html')
# 	# return app.send_static_file('index.build.html')

@app.route('/')
def root():
	if getattr(sys,"frozen", False):
		return app.send_static_file("index.build.html")
	return open("index.html").read()
	# print app.static_url_path, app.static_folder
	# return app.send_static_file('index.html')
	# return app.send_static_file('index.build.html')

@app.route('/<path:path>')
def static_proxy(path):
  # send_static_file will guess the correct MIME type
  return app.send_static_file(path)


@app.route('/manifest.appcache')
def manifest():
	if getattr(sys,"frozen", False):
		return send_from_directory(app.static_folder, 'manifest.appcache', mimetype="text/cache-manifest")
	return send_from_directory('', 'manifest.appcache', mimetype="text/cache-manifest")
    # res = make_response(open('manifest.appcache').read(), 200)
    # res.headers["Content-Type"] = "text/cache-manifest"
    # return res

if __name__ == "__main__":
	# app.run()
	import argparse

	import socket
	host = socket.gethostbyname(socket.gethostname())

	parser = argparse.ArgumentParser()
	parser.add_argument('server', nargs='?', type=str, help='Hostname', default=host)
	parser.add_argument('port', nargs='?', type=int, help='Port number', default=80)
	parser.add_argument('--version', action='version', version='%(prog)s ' + VERSION)
	
	args = parser.parse_args()
	socketio.run(app, host=args.server, port=args.port)
	# socketio.run(app, host="0.0.0.0", port=8000)
	# socketio.run(app, host="0.0.0.0", port=8000, use_reloader=True)
	
	del j