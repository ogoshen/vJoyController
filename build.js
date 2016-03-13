require('shelljs/make');

target.all = function() {
	// target.version();
	target.dependencies();
	target.polybuild();
	target.deploy();
	target.freeze();
}

target.dependencies = function() {
	echo('Installing node dependencies');

	// var npm = which('npm');
	const npm = 'npm';

	['-g bower',
	'-g polybuild',
	'-g vulcanize',
	'shelljs@0.6.0'].forEach(function(i){
		exec(npm + ' install ' + i);
	});

	echo('Installing python dependencies');
	const pip = which('pip') || 'C:\\Python27\\Scripts\\pip.exe';

	// upgrade pip to avoid warnings
	exec(pip + ' install --disable-pip-version-check --user --upgrade pip');

	['flask',
	'flask-socketio',
	'esky',
	'eventlet',
	'py2exe_py2',
	'cx-Freeze'].forEach(function(i){
		exec(pip + ' install ' + i);
	});

}

target.version = function(args) {
	var py = grep('VERSION=', 'main.py').match(/VERSION=['"](.*)['"]/)[1];
	// var git = exec('git rev-parse --short HEAD', {silent:true}).stdout;
	var ver = py + '.' + (args[0] || '');
	echo(ver).to('version.txt');
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

	const dist_path = 'dist/app';
	if (!test('-d', dist_path))
		mkdir('-p', dist_path);
	cp(files, dist_path);
}

target.freeze = function(args) {
	echo('Freezing...');
	if(exec('python -OO setup.py bdist_esky').code !== 0) {
		echo('esky build failed!');
		exit(1);
	}
}