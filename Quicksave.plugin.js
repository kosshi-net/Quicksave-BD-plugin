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
	return "Lets you save images fast with a short random name.";
};
Quicksave.prototype.getVersion = function () {
	return "0.1.6";
};

Quicksave.prototype.start = function () {};
Quicksave.prototype.stop = function () {};
Quicksave.prototype.load = function () {};
Quicksave.prototype.unload = function () {};
Quicksave.prototype.onMessage = function () {};
Quicksave.prototype.onSwitch = function () {};


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
	// Fun stuff
	var settings = this.loadSettings();
	var fs = require('fs');
	if(e.addedNodes.length > 0 && e.addedNodes[0].className=='callout-backdrop'){
		var elem = document.getElementsByClassName('modal-image')[0];
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
				button.className = "download-button";
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
		settings.fnLength = document.getElementById('qs_fnLength').value;
		settings.norandom = document.getElementById('qs_norandom').checked;
		
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

Quicksave.prototype.settingsVersion = 5;
Quicksave.prototype.defaultSettings = function () {
	return {
		version: this.settingsVersion,
		direcotry: "none",
		norandom: false,
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
	var settings = (bdPluginStorage.get(this.getName(), 'config')) ? JSON.parse(bdPluginStorage.get(this.getName(), 'config')) : {version:"0"};
	if(settings.version != this.settingsVersion){
		console.log('['+this.getName()+'] Settings were outdated/invalid/nonexistent. Using default settings.');
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
	html +=	"<input id='qs_directory' type='text' value=" + (settings.direcotry) + " style='width:100% !important;'> <br><br>";

	html += "<input type='checkbox' id='qs_norandom'";
	html += (settings.norandom) ? " checked>" : ">";
	html += "Save files with original filename instead of new random one<br><br>";

	html += "Random filename length<br>";
	html +=	"<input id='qs_fnLength' type='number' value=" + (settings.fnLength) + "> <br><br>";

	html +="<br><button onclick='BdApi.getPlugin('"+this.getName()+"').saveSettings(this)'>Save and apply</button>";
	html +="<button onclick='BdApi.getPlugin('"+this.getName()+"').resetSettings(this)'>Reset settings</button> <br><br>";

	html += "<p style='color:red' id='qs_err'></p>";

	html += "Help!<br>";
	html += "\"What to put in the directory thing?\"<br>";
	html += "C:/Users/youruser/Desktop/ for example.<br><br>";


	html += "Protip! Saved files get a random base64 name. Only 4 chars allow ~17 million different filenames (64^4).<br><br>";

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
	var url = document.getElementsByClassName('modal-image')[0].childNodes[1].attributes[0].nodeValue;
	var net = (url.split('//')[0]=='https:') ? require('https') : require('http');

	var filename;
	// I will NOT async these. No.
	if(settings.norandom){

		filename = url.split('/').slice(-1)[0].split('?')[0];

		if(plugin.accessSync(dir+filename)){
			button.innerHTML = "Error: File "+filename+" already exists";
			return;
		}
	}else{
		filename = plugin.randomFilename64(settings.fnLength);

		var filetype =  '.'+url.split('.').slice(-1)[0].split('?')[0];

		var funnybugs = 50;
		while(plugin.accessSync(dir+filename+filetype) && funnybugs--)
			filename = plugin.randomFilename64(settings.fnLength);
		if(funnybugs == -1){
			button.innerHTML = "Error: Failed to find a free filename";
			return;
		}
		filename += filetype;
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
		if(document.getElementById('qs_button'))
			button.innerHTML = "Error: " + err.message;
		else
			BdApi.getCore.alert('Quicksave Error', 'Failed to download file '+url+'\nError: '+err.message);
		console.log(err.message);
		file.close();
	});
	
};
