// jshint browser:true
// jshint devel:true
// jshint jquery:true

(function($, _, io, Polymer, Hammer) {
	'use strict';

	$('body').on('touchmove', function(e) {
		e.preventDefault();
	});

	const Axis = {
		X: 0x30,
		Y: 0x31,
		Z: 0x32,
		RX: 0x33,
		RY: 0x34,
		RZ: 0x35,
		SL0: 0x36,
		SL1: 0x37,
		WHL: 0x38,
		POV: 0x39,
	};

	function Joystick() {

		// xaxis name
		// yaxis name
		// (x, y) values vector
		function _emit(x, y, v) {
			if (!socket || !socket.connected)
				return;

			var axes = _.values(_.pick(Axis, x, y));

			socket.emit('joystick', [{
					'axis': axes[0],
					'value': ~~v.x
				}, {
					'axis': axes[1],
					'value': ~~v.y
				}]
				//, function(res) {
				// $("#connection_status iron-icon").attr('icon', 'device:signal-cellular-4-bar');
				//}
			);
		}

		var _rate = 33;
		var _cache = [];
		var emit = function(x, y, v) {
			var k = x + y;
			if (!(k in _cache)) {
				_cache[k] = _.throttle(_emit, _rate, {
					leading: true,
					trailing: true
				});
				console.log(k);
			}
			_cache[k](x, y, v);
		};

		return {
			set rate(v) {
				_rate = v;
				_cache = [];
				app.notifyPath('joystick.rate', app.joystick.rate);
			},
			get rate() {
				return _rate;
			},
			emit: emit
		};
	}

	if ('orientation' in screen) {
		screen.orientation.lock('landscape');
	}

	window.addEventListener("contextmenu", function(e) {
		e.preventDefault();
	});

	var app = document.querySelector('#app');
	app.host = location.hostname;
	app.port = location.port || 80;
	if (localStorage.server) {
		var s = localStorage.server.split(',');
		app.host = s[0];
		app.port = s[1];
	}
	app.closeDrawer = function() {
		app.$.paperDrawerPanel.closeDrawer();
	};

	app.joystick = new Joystick();

	var socket = null;


	window.addEventListener('WebComponentsReady', function() {


		// var socket = io.connect('http://' + document.domain + ':' + location.port + '/');

		app.connect = function(host, port) {
			host = host || app.host || location.hostname;
			port = port || app.port || location.port;
			localStorage.server = [host, port];
			if (socket)
				socket.close();
			socket = app.socket = io.connect('http://' + host + ':' + port + '/');
			socket.on('connect', function() {
				// document.querySelector("#connection_status").firstChild.nodeValue = 'Connected';
				// $("#connection_status iron-icon").attr('icon', 'device:signal-cellular-4-bar');

				setTimeout(function() {
					$("#connection_status iron-icon").attr('icon', 'hardware:phonelink');
					$("#toast").html('<iron-icon icon="icons:checkmark"></iron-icon> Connected to ' + host)[0].open();
					$("#modal")[0].close();
					app.notifyPath('socket.connected', socket.connected);
				}, 0);
			});
			socket.on('disconnect', function() {
				// document.querySelector("#connection_status").firstChild.nodeValue = 'Disconnected';
				// $("#connection_status iron-icon").attr('icon', 'device:signal-cellular-null');
				$("#connection_status iron-icon").attr('icon', 'hardware:phonelink-off');
				$("#toast").html('Disconnected')[0].open();
				// socket.off('connect_error');
				socket.off();
				app.notifyPath('socket.connected', socket.connected);
			});
			socket.on('connect_error', function(e) {
				console.log(e);
				$("#toast").html('<iron-icon icon="device:signal-cellular-connected-no-internet-0-bar"></iron-icon> ' + e)[0].open();
				socket.off();
				app.notifyPath('socket.connected', socket.connected);
			});
		};

		if (localStorage.server) {
			var s = localStorage.server.split(',');
			app.host = s[0];
			app.port = s[1];
			// _.delay(app.connect, 500, app.host, app.port);
			Polymer.Base.async(app.connect, 500);
		}

		$('joystick-dpad').each(function() {
			$(this).on('change', function(e) {
				if (this.disabled)
					return;
				if (socket && socket.connected) {
					var v = e.detail.value;
					socket.emit('joystick dpad', v < 0 ? -1 : v * 100);
				}
			});
		});

		$("joystick-stick").each(function() {
			$(this).on('change', function(e) {
				// console.log(e);

				var v = {
					x: e.detail.x,
					y: e.detail.y
				};

				v.x = (v.x + 1) * 0.5 * 0x8000;
				v.y = (v.y + 1) * 0.5 * 0x8000;

				v.x = ~~Math.max(0, Math.min(v.x, 0x8000 - 1));
				v.y = ~~Math.max(0, Math.min(v.y, 0x8000 - 1));

				// var axes = _.values(_.pick(Axis, e.detail.xaxis, e.detail.yaxis));
				// joystick.emit(axes[0], axes[1], v);

				app.joystick.emit(e.detail.xaxis, e.detail.yaxis, v);

			});
		});


		[].forEach.call(document.querySelectorAll("joystick-button"), function(btn) {
			var f = 'saturate(85%) brightness(120%) drop-shadow(0 0 8px ' + btn.iconColor + ')';
			btn.addEventListener('pressed-changed', function onBtnPressed(e) {
				// console.log([btn, e]);
				// console.log($(this).attr('index'));
				if (socket && socket.connected) {
					var index = ~~$(this).attr('index');
					socket.emit('joystick button', index, e.detail.value);
				}
			});
			btn.addEventListener('down', function() {
				$(this).addClass('pressed');
				$("svg", this).css({
					'-webkit-filter': f
				});
			});
			btn.addEventListener('up', function() {
				$(this).removeClass('pressed');
				$("svg", this).css({
					'-webkit-filter': ''
				});
			});
		});


		$("#edit").on('change', function onEditChanged() {
			// console.log(e);
			// document.body.requestFullScreen();
			// document.body.webkitRequestFullScreen ();
			var hs = ['joystick-dpad', 'joystick-stick', '.ps-buttons', '#menu-buttons'].join(',');
			hs += ',' + 'joystick>joystick-button';

			if (!this.checked) {
				$(hs).each(function(i, el) {
					// el.hammer.off('pinchstart pinchmove pinchend');
					// el.hammer.off('panstart panmove panend pancancel');
					el.hammer.destroy();
					$(this).removeClass('edit');
					if (el.disabled !== undefined)
						el.disabled = false;
				});
			} else
				$(hs).each(function(i, el) {
					if (el.disabled !== undefined)
						el.disabled = true;

					$(this).addClass('edit');

					var p0 = {
						x: 0,
						y: 0
					};

					var h = new Hammer(el);
					el.hammer = h;

					var transform = el._transform || {
						translate: {
							x: p0.x,
							y: p0.y
						},
						scale: 1,
						apply: function() {
							// var t = 'translate3d(' + [this.translate.x + 'px', this.translate.y + 'px'].join(',') + ', 0)';		
							var t = 'translate(' + [this.translate.x + 'px', this.translate.y + 'px'].join(',') + ')';
							if (this.scale != 1)
								t += ' scale(' + this.scale + ')';
							// el.style.transform = el.style.webkitTransform = t;
							Polymer.Base.transform(t, el);
							el._transform = transform;
						}
					};

					h.on('transform', transform.apply);

					h.get('pan').set({
						enable: true,
						pointers: 0,
					});
					h.get('pinch').set({
						enable: true
					});
					// h.get('pan').set({threshold:0});
					h.get('pan').recognizeWith(h.get('pinch'));

					var initScale = 1;
					h.on('pinchstart pinchmove pinchend', function(e) {
						if (e.type == 'pinchstart') {
							$(el).addClass('scaled');
							initScale = transform.scale || 1;
						}
						if (e.type == 'pinchend') {
							$(el).removeClass('scaled');
						}
						transform.scale = initScale * e.scale;
						transform.apply();
					});

					h.on('panstart panmove panend pancancel', function(e) {
						if (e.type == 'panstart') {
							p0 = {
								x: transform.translate.x,
								y: transform.translate.y
							};
							$(el).addClass('dragged');
							$(el).css('touch-action',  'manipulation');
						}
						if (e.type == 'panend' || e.type == 'pancancel') {
							$(el).removeClass('dragged');
							$(el).css('touch-action',  '');
						}
						transform.translate.x = p0.x + e.deltaX;
						transform.translate.y = p0.y + e.deltaY;
						transform.apply();
					});
				});

		});

	});

})($, _, io, Polymer, Hammer);