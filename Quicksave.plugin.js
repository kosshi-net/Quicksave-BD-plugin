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
	return "0.2.1";
};


Quicksave.prototype.load = function () {};
Quicksave.prototype.unload = function () {};
Quicksave.prototype.onMessage = function () {};
Quicksave.prototype.onSwitch = function () {};

Quicksave.prototype.start = function () {

	BdApi.injectCSS("quicksave-style", `
		.thumbQuicksave {

			z-index: 9000!important;

			background-color: rgba(51, 51, 51, .8);

			position: absolute;
			display: block;

			padding: 3px 9px;
			margin: 5px;

			border-radius: 3px;

		    font-family: inherit;
		    color: #FFF;
			font-weight: 500;
			font-size: 14px;
			opacity: 0;
		}


		.imageWrapper-38T7d9:hover .thumbQuicksave {
			opacity: 0.8;
		}

		.thumbQuicksave:hover {
			opacity: 1 !important;
		}
	`);

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
	BdApi.clearCSS("quicksave-style");
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

	// IMAGE OPEN BUTTON
	if(e.addedNodes.length > 0 && e.addedNodes[0].className=='backdrop-2ohBEd'){

		var settings = this.loadSettings();
		var fs = require('fs');

		// Element that has the "Open Original" button as a child
		var elem = document.querySelector(
			'div.modal-2LIEKY > div > div > div:nth-child(2)'
		);

		if(!elem) return;

		var button = document.createElement('a');

		// This class gives the styling of the Open Original buttom
		// These will break every other update now it seems
		button.className = "downloadLink-wANcd8 size14-1wjlWP weightMedium-13x9Y8"; 

		fs.access(settings.direcotry, fs.W_OK, err=>{
			if (err){
				button.id = "qs_button";
				
				button.innerHTML = "Can't Quicksave: save location is invalid";
			}else{
				button.id = "qs_button";
				button.href = "#";
				button.onclick = this.saveCurrentImage.bind(this);


				button.style.paddingLeft = "10px";

				button.innerHTML = "Quicksave";
			}	

			elem.appendChild(button);

		});
	}

	// THUMBNAIL BUTTON
	for(let i = 0; i < e.addedNodes.length; i++){


		if(e.addedNodes[i].localName != "img") continue;
		if(!e.addedNodes[i].parentElement.classList.contains('imageWrapper-38T7d9')) continue;

		console.log('SHOULD APPEND', e.addedNodes[i]);
		let div = document.createElement('div');

		div.innerHTML = "Save";

		div.className = "thumbQuicksave";

		div.onclick = (e)=>{
			// Prevent parent from opening the image
			e.stopPropagation();
			e.preventDefault();

			this.saveThumbImage(e);
		};

		// appendChild but as the first child
		e.addedNodes[i].parentElement.insertAdjacentElement('afterbegin', div);


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



// Only purpoise of the next two functions is to interact with the DOM! 
// These will be called when user clicks on save image buttons.
// Extract the url, run download() and display info to user here.
Quicksave.prototype.saveCurrentImage = function(){
	// Called from the modal
	var button = document.getElementById('qs_button');
	var plugin = BdApi.getPlugin('Quicksave');

	var url = document.querySelector(
		'div.modal-2LIEKY > div > div > div:nth-child(2) > a:nth-child(1)'
	).attributes[0].nodeValue;

	if(!url) {
		button.innerHTML = "Error: Couldn't extract url!";
		return;
	}

	button.innerHTML = "Downloading...";

	plugin.download(url, (err)=>{
		if(err) 
			button.innerHTML = "Error! " + err;
		else
			button.innerHTML = "Download finished!";
	}, 

	(bytes, total) => {
		button.innerHTML = `${bytes}b/${total}b (${(bytes/total*100)|0}%)`;
	});
};

Quicksave.prototype.saveThumbImage = function(e){
	// Reimplementation of pull #2, icon in thumbnails
	var button = e.srcElement;
	var plugin = BdApi.getPlugin('Quicksave');


	var url = button.parentElement.href;

	if(!url) {
		button.innerHTML = "Error";
		console.error("Couldn't extract url!");
		return;
	}

	button.innerHTML = "Wait";

	plugin.download(url, (err)=>{
		if(err) {
			button.innerHTML = "Error";
			console.error("Quicksave error: "+err);
		}
		else
			button.innerHTML = "Done";
	}, 

	(bytes, total) => {
		button.innerHTML = `${(bytes/total*100)|0}%`;
	});
};




Quicksave.prototype.download = function(url, callback, progressCallback){
	// Decides the filename, downloads and writes the file
	//
	//	callback:
	//		In case of errors, first argument will be a string describing the error.
	//		If everything's fine, its gonna be null
	//
	//	progressCallback
	//		First argument will be downloaded bytes, second is total bytes

	var plugin = BdApi.getPlugin('Quicksave');
	var settings = plugin.loadSettings();
	var fs = require('fs');
	var dir = settings.direcotry;

	// Removes ":large" from twitter's image urls. Pulled feature.
	var twitterFix = new RegExp(":large$");
	if (twitterFix.test(url)) url = url.replace(twitterFix, '');	

	// Using node apis lets us skip all security built to chrome. This is useful
	// if we want to download from anywhere we want, and we do: Discords rehosts
	// are usually compressed.
	// Can https use http? is this seperation necessary?
	var net = (url.split('//')[0]=='https:') ? require('https') : require('http');


	var filename = plugin.namingMethods[ settings.namingmethod ](
		plugin, settings, url, dir
	);

	if(filename === null){
		callback("Error while trying to find a free filename!");
		return;
	}

	var dest = dir+filename;
	console.info("Quicksaving");
	console.log(url);
	console.log('-->');
	console.log(dest);


	// TODO: 
	// Check if the downloaded file is actually an image
	// Make sure we dont download gigabytes
	// Dont write odd filenames, i've had my windows get very confused

	const req = net.request(url, (res) => {
		// console.log('statusCode:', res.statusCode);
		// console.log('headers:', res.headers);
		console.log(`${res.statusCode} ${url}`);
		console.log(res);

		if(res.statusCode != 200) {
			callback("Server responded with "+ res.statusCode);
			return;
		}


		let contentType = res.headers["content-type"];

		if( contentType.search('image') < 0 ) {
			callback(`Content-type '${contentType}' is not an image.`);
			return;
		}

		let total = res.headers["content-length"];
		let bytes = 0;

		// Keep the file fragmented until all chunks are downloaded, then 
		// concat. The only reason to do this is the ease of implementation.

		let chunks = [];

		res.on('data', (d) => {
			chunks.push(d);

			bytes+=d.length;
			if(progressCallback) progressCallback(bytes, total);
		});

		res.on('end', ()=> {
			fs.writeFile(dest, Buffer.concat(chunks), (err)=>{
				if(err){
					console.error(err);
					callback(err.message);
				} else {
					callback(null);
				}
			});
		});
	});

	req.on('error', (err) => {
		console.error(err);
		callback(err.message);
	});
	req.end();
};

