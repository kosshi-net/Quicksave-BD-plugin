//META{"name":"Quicksave"}*//

'use strict';
var Quicksave = function () {};
Quicksave.prototype.getAuthor = function () {
	return "kosshi";
};
Quicksave.prototype.getName = function () {
	return "Quicksave";
};
Quicksave.prototype.getDescription = function () {
	return "Lets you save images fast.";
};
Quicksave.prototype.getVersion = function () {
	return "0.2.0";
};


Quicksave.prototype.load = function () {};
Quicksave.prototype.unload = function () {};
Quicksave.prototype.onMessage = function () {};
Quicksave.prototype.onSwitch = function () {};

Quicksave.prototype.start = function () {

	this.namingMethods = {
		// You can add your own naming methods easily, just copy that function 
		// line and change the name, no other mods needed. Use "plugin" instead 
		// of "this", latter might work but im too lazy to check and fix it.
		// Return the name. Perform all the checks here, the plugin will just 
		// blindly overwrite otherwise. Return null if something goes wrong.

		random:function(plugin, settings, url, dir){

			let filename = plugin.randomFilename64(settings.fnLength);

			// Should be replaced with regex
			let filetype =  '.'+url.split('.').slice(-1)[0].split('?')[0];

			let loops = 50;
			while(plugin.accessSync(dir+filename+filetype) && loops--)
				filename = plugin.randomFilename64(settings.fnLength);

			if(loops == -1){
				console.error(
					'Could not find a free filename ),: Check permissions or '+
					'increase filename lenght'
				);
				return null;
			}

			return filename+filetype;
		},

		original:function(plugin, settings, url, dir){

			// Should be replaced with regex
			let filename_original = url.split('/').slice(-1)[0].split('?')[0];
			let temp = filename_original.split('.');
			let filetype_original = '.'+temp.pop();
			filename_original = temp.join('.');

			let filename = filename_original+filetype_original;

			let num = 2;
			let loops = 2048;
			while( plugin.accessSync(dir+filename) && loops-- ){
				filename = filename_original + ` (${num})` + filetype_original;
				num++;
			}

			if(loops == -1){
				console.error(
					'Could not find a free filename ),: Possible causes: no '+
					'permissions or you have saved truckloads of images with '+
					'this name'
				);
				return null;
			}

			return filename;
		}
	}

};

Quicksave.prototype.stop = function () {
};

Quicksave.prototype.accessSync = function(dir){
	var fs = require('fs');
	try {
		fs.accessSync(dir, fs.F_OK);
		return true;
	} catch (e) {
		return false;
	}
};


Quicksave.prototype.observer = function (e) {
	// MutationObserver, function is bound by BetterDiscord.
	// We use this to see if user opens an image, if so, add a button.

	if(e.addedNodes.length > 0 && e.addedNodes[0].className=='backdrop-2ohBEd'){

		var settings = this.loadSettings();
		var fs = require('fs');

		// Element that has the "Open Original" button as a child
		var elem = document.querySelector(
			'div.modal-2LIEKY > div > div > div:nth-child(2)'
		);

		if(!elem) return;

		var button = document.createElement('a');
		fs.access(settings.direcotry, fs.W_OK, err=>{
			if (err){
				button.id = "qs_button";
				
				button.className = "download-button";
				button.innerHTML = "Can't Quicksave: save location is invalid";
			}else{
				button.id = "qs_button";
				button.href = "#";
				button.onclick = this.saveCurrentImage.bind(this);

				// This class gives the styling of the Open Original buttom
				// These will break every other update now it seems
				button.className = "downloadLink-wANcd8 size14-1wjlWP weightMedium-13x9Y8"; 

				button.style.paddingLeft = "10px";

				button.innerHTML = "Quicksave";
			}	

			elem.appendChild(button);

		});
	}
	
};
Quicksave.prototype.saveSettings = function (button) {
	var settings = this.loadSettings();
	var dir = document.getElementById('qs_directory').value;
	
	var plugin = BdApi.getPlugin('Quicksave');
	var err = document.getElementById('qs_err');

	if(dir.slice(-1)!='/') dir+='/';
	
	if( plugin.accessSync(dir) ){
	

		settings.direcotry = dir;
		settings.fnLength = 	document.getElementById('qs_fnLength').value;
		settings.namingmethod = document.getElementById('qs_namingmethod').value;
		
		bdPluginStorage.set(this.getName(), 'config', JSON.stringify(settings));

		plugin.stop();
		plugin.start();
		
		err.innerHTML = "";
		button.innerHTML = "Saved and applied!";
	} else {
		err.innerHTML = "Error: Invalid directory!";
		return;
	}
		setTimeout(function(){button.innerHTML = "Save and apply";},1000);
};

// Incrementing this will cause the settings to be reset
Quicksave.prototype.settingsVersion = 6; 
Quicksave.prototype.defaultSettings = function () {
	return {
		version: this.settingsVersion,
		direcotry: "none",
		namingmethod: "original",
		fnLength: 4
	};
};

Quicksave.prototype.resetSettings = function (button) {
	var settings = this.defaultSettings();
	bdPluginStorage.set(this.getName(), 'config', JSON.stringify(settings));
	this.stop();
	this.start();
	button.innerHTML = "Settings resetted!";
	setTimeout(function(){button.innerHTML = "Reset settings";},1000);
};

Quicksave.prototype.loadSettings = function() {
	// Loads settings from localstorage
	var settings = (bdPluginStorage.get(this.getName(), 'config')) ? 
		JSON.parse( bdPluginStorage.get(this.getName(), 'config')) : 
		{version:"0"};

	if(settings.version != this.settingsVersion){
		console.log(
			`[${this.getName()}] Settings were outdated/invalid/nonexistent.`+
			` Using default settings.`
		);
		settings = this.defaultSettings();
		bdPluginStorage.set(this.getName(), 'config', JSON.stringify(settings));
	}
	return settings;
};

Quicksave.prototype.import = function (string) {
	bdPluginStorage.set(this.getName(), 'config', string);
	this.stop();
	this.start();
}


Quicksave.prototype.getSettingsPanel = function () {
	var settings = this.loadSettings();
	var html = "<h3>Settings Panel</h3><br>";
	html += "Quicksave directory<br>";
	html +=	`<input id='qs_directory' type='text' value=${settings.direcotry} 
			 style='width:100% !important;'> <br><br>`;

	html += "File naming method <br> <select id='qs_namingmethod'>";

	for (let m in this.namingMethods) 
		html += `<option value=${m} ${settings.namingmethod==m?" selected":""}>
					${m}
				 </option> `;

	html += "</select>";
	html += "<br><br>";

	html += "Random filename length<br>";
	html +=	`<input id='qs_fnLength' type='number' value=${settings.fnLength}>`;

	html +=`<br><br><br>
	<button onclick=BdApi.getPlugin('${this.getName()}').saveSettings(this)>
		Save and apply
	</button>

	<button onclick=BdApi.getPlugin('${this.getName()}').resetSettings(this)>
		Reset settings
	</button> <br><br>
	 `;

	html += "<p style='color:red' id='qs_err'></p>";

	html += "Help!<br>";
	html += '"What to put in the directory thing?"<br>';
	html += "C:/Users/youruser/Desktop/ for example.<br><br>";

	return html;
};

Quicksave.prototype.randomFilename64 = function(length){
	var name = '';
	while(length--)
		name += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'[ (Math.random()*64|0) ];
	return name;
};


Quicksave.prototype.saveCurrentImage = function(){
	var button = document.getElementById('qs_button');
	button.innerHTML = "Downloading...";
	var plugin = BdApi.getPlugin('Quicksave');
	var settings = plugin.loadSettings();
	var fs = require('fs');
	var dir = settings.direcotry;


	var url = document.querySelector(
		'div.modal-2LIEKY > div > div > div:nth-child(2) > a:nth-child(1)'
	).attributes[0].nodeValue;


	// Removes ":large" from twitter's image urls. Pulled feature.
	var twitterFix = new RegExp(":large$");
	if (twitterFix.test(url)) url = url.replace(twitterFix, '');	


	var net = (url.split('//')[0]=='https:') ? require('https') : require('http');

	var filename = plugin.namingMethods[settings.namingmethod](plugin, settings, url, dir);

	if(filename === null){
		button.innerHTML = 
			'Error while trying to find a free filename!'+
			'Check console for more details.';
		return;
	}

	var dest = dir+filename;
	console.info("Quicksaving");
	console.log(url);
	console.log('-->');
	console.log(dest);

	var file = fs.createWriteStream(dest);
	net.get(url, function(response) {
		response.pipe(file);
		file.on('finish', function() {
			console.log("Finished");
			button.innerHTML = "Download finished";
			file.close();
		});
	}).on('error', function(err) {
		fs.unlink(dest); 

		// User may have closed the image, the button is no longer visible.
		// When this happens, use BetterDiscords alert function that does not
		// work! What is Jiiks doing?
		if(document.getElementById('qs_button')) 
			button.innerHTML = "Error: " + err.message;
		else
			BdApi.getCore().alert(
				'Quicksave Error', 
				`Failed to download file ${url}\nError: `+ err.message
			);

		console.log(err.message);
		file.close();
	});
	
};
