require('shelljs/make');

target.all = function() {
	target.polybuild();
	target.deploy();
	target.freeze();
}

target.polybuild = function(args) {
	echo('Running polybuild...');
	if(exec('polybuild index.html --maximumCrush').code !== 0) {
		echo('polybuild failed!');
		exit(1);
	}
}

target.deploy = function(args) {
	echo('Creating manifest...');
	var manifest = {
	  "short_name": "vJoy",
	  "name": "vJoy Controller",
	  "display": "fullscreen",
	  "orientation": "landscape",
	  "background_color": "#3C3C40",
	  "start_url": "index.build.html",
	  "icons": [
	    {
	     "src": "icon.svg",
	    },
	   ]
	};
	echo(JSON.stringify(manifest, null, 4)).to('manifest.json');

	var files = [
		// 'android-icon-144x144.png',
		// 'android-icon-192x192.png',
		// 'android-icon-36x36.png',
		// 'android-icon-48x48.png',
		// 'android-icon-72x72.png',
		// 'android-icon-96x96.png',
		'favicon.ico',
		'icon.svg',
		'index.build.html',
		'index.build.js',
		'manifest.appcache',
		'manifest.json',
	];

	echo('Copying files...');
	mkdir('-p', 'dist/app');
	cp(files, 'dist/app');
}

target.freeze = function(args) {
	echo('Freezing...');
	if(exec('python -OO setup.py bdist_esky').code !== 0) {
		echo('esky build failed!');
		exit(1);
	}
}