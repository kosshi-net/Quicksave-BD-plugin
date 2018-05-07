//META{"name":"Quicksave"}*//

'use strict';
class Quicksave {
	getAuthor()		{ return "kosshi";}
	getName()		{ return "Quicksave";}
	getVersion()	{ return "0.2.5";}
	getDescription(){ return "Lets you save images fast.";}
	load() {} // Called when the plugin is loaded in to memory
	start() {
		this.settingsVersion = 6; 

		this.extensionWhitelist = 
			`png, gif, jpg, jpeg, jpe, jif, jfif, jfi, bmp, apng, webp`;

		this.namingMethods = {
			original:"Keep Original",
			random:  "Random"
		};

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

			.imageWrapper-2p5ogY:hover .thumbQuicksave {
				opacity: 0.8;
			}

			.thumbQuicksave:hover {
				opacity: 1 !important;
			}

			#qs_button {
				padding-left: 10px;
			}
		`);

		this.injectThumbIcons();
	}

	stop() {
		clearTimeout(this.injectionTimeout);
		BdApi.clearCSS("quicksave-style");
	}

	accessSync(dir){
		var fs = require('fs');
		try {
			fs.accessSync(dir, fs.F_OK);
			return true;
		} catch (e) {
			return false;
		}
	}


	observer(e) {
		// MutationObserver, function is bound by BetterDiscord.
		// We use this to see if user opens an image, if so, add a button.

		var fs = require('fs');

		// IMAGE OPEN BUTTON
		if(    e.addedNodes.length > 0 
			&& e.addedNodes[0].className=='backdrop-1ocfXc'
			){

			// console.info(e.addedNodes[0]);

			let modal = document.querySelector('div.modal-1UGdnR');

			// Check if the added element actually has image modal, loading or not
			if(
				// !modal.querySelector('.imagePlaceholder-jWw28v') &&
				!modal.querySelector('.imageWrapper-2p5ogY')
			) 
			return;

			// 
			// imagePlaceholderOverlay-3uPw1V imagePlaceholder-jWw28v

			// Element that has the "Open Original" button as a child
			let buttonParent = document.querySelector(
				'div.modal-1UGdnR > div > div > div:nth-child(2)'
			);
			if(!buttonParent) return;

			let settings = this.loadSettings();

			let button = document.createElement('a');

			// This class gives the styling of the Open Original buttom
			// These will break every other update now it seems
			button.className = 
				"downloadLink-2oSgiF size14-3iUx6q weightMedium-2iZe9B"; 

			button.id = "qs_button";
			button.href = "#";

			// Should the access be checked all the time like this?
			fs.access(settings.direcotry, fs.W_OK, (err)=>{
				if (err){
					button.innerHTML = 
						"Can't Quicksave: Go to plugin settings and "+
						"set the download directory!";
				}else{
					button.onclick = this.saveCurrentImage.bind(this);
					button.innerHTML = "Quicksave";
				}	

				buttonParent.appendChild(button);
			});
		}
	}

	injectThumbIcons() {
		var fs = require('fs');
		let list = document.querySelectorAll("img");
		for (let i = 0; i < list.length; i++) {
			let elem = list[i].parentElement;
			//console.log(elem);
			
			if(	!elem.href
			 || !elem.classList.contains('imageWrapper-2p5ogY')
			 ||  elem.querySelector('.thumbQuicksave')
			) continue;

			let div = document.createElement('div');
			div.innerHTML = "Save";
			div.className = "thumbQuicksave";

			let settings = this.loadSettings();
			fs.access(settings.direcotry, fs.W_OK, (err)=>{
				if (err)
					div.innerHTML = "Dir Error";
				else
					div.onclick = (e)=>{
						// Prevent parent from opening the image
						e.stopPropagation();
						e.preventDefault();

						this.saveThumbImage(e);
					};

				// appendChild but as the first child
				elem.insertAdjacentElement('afterbegin', div);
			});
		}

		// Originally this code was in mutationobserver, but that wasn't reliable.
		// Now we use this timeout loop with global img search. Not optimal but
		// works very well (and maybe even better perfomance wise?)
		this.injectionTimeout = setTimeout(this.injectThumbIcons.bind(this), 2000);
	}

	saveSettings (button) {
		var settings = this.loadSettings();
		var dir = document.getElementById('qs_directory').value;
		
		var plugin = BdApi.getPlugin('Quicksave');
		var err = document.getElementById('qs_err');

		if(dir.slice(-1)!='/') dir+='/';
		
		if( plugin.accessSync(dir) ){
		
			settings.direcotry = dir;
			settings.fnLength = 	document.getElementById('qs_fnLength')    .value;
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
	}
	
	defaultSettings() {
		return {
			version: this.settingsVersion,
			direcotry: "none",
			namingmethod: "original",
			fnLength: 4
		};
	}

	resetSettings(button) {
		var settings = this.defaultSettings();
		bdPluginStorage.set(this.getName(), 'config', JSON.stringify(settings));
		this.stop();
		this.start();
		button.innerHTML = "Settings resetted!";
		setTimeout(function(){button.innerHTML = "Reset settings";},1000);
	}

	loadSettings() {
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
	}

	getSettingsPanel () {
		var settings = this.loadSettings();
		// rip column rules
		var html = 
		`
		<h3>Settings Panel</h3><br>
		<p>Quicksave directory<p>
		<input id='qs_directory' type='text' value=${settings.direcotry} style='width:100% !important;'> <br><br>

		<p>File naming method</p>
		<select id='qs_namingmethod'>
		`;

		for (let m in this.namingMethods) html += `<option value=${m} ${settings.namingmethod==m?" selected":""}>${m}</option>`;

		html+=
		`</select>
		<br><br>

		Random filename length<br>
		<input id='qs_fnLength' type='number' value=${settings.fnLength}>

		<br><br><br>
		<button onclick=BdApi.getPlugin('${this.getName()}').saveSettings(this)>
			Save and apply
		</button>

		<button onclick=BdApi.getPlugin('${this.getName()}').resetSettings(this)>
			Reset settings
		</button> <br><br>

		<p style='color:red' id='qs_err'></p>";

		Help!<br>
		"What to put in the directory thing?"<br>
		C:/Users/youruser/Desktop/ for example.<br><br>
		`;
		return html;
	}

	randomFilename64(length){
		var name = '';
		while(length--)
			name += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'[ (Math.random()*64|0) ];
		return name;
	}



	// Only purpoise of the next two functions is to interact with the DOM! 
	// These will be called when user clicks on save image buttons.
	// Extract the url, run download() and display info to user here.
	saveCurrentImage(){
		// Called from the modal
		var button = document.getElementById('qs_button');
		var plugin = BdApi.getPlugin('Quicksave');

		var url = document.querySelector(
			'div.modal-1UGdnR > div > div > div:nth-child(2) > a:nth-child(1)'
		);

		if(!url) {
			button.innerHTML = "Error: Couldn't extract url!";
			return;
		}

		url = url.attributes[0].nodeValue; // do proper error detection for this

		button.innerHTML = "Downloading...";

		plugin.download(url, (err)=>{
			if(err) 
				button.innerHTML = "Error! " + err;
			else
				button.innerHTML = "Download finished!";
		}, 

		(bytes, total) => {

			const f = bytes/total;
			const totalBars = 10;

			let filledBars = Math.round(f*totalBars);
			let bar = "";

			for (var i = 0; i < totalBars; i++)
				bar+= i<filledBars ? "▓" : "░"; // Who needs fancy graphics lol
					
			button.innerHTML = `[${bar}]`;

		});
	}

	saveThumbImage(e){
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
	}

	download(url, callback, progressCallback){
		// Decides the filename, downloads and writes the file
		//
		//	callback:
		//		In case of errors, first argument will be a string describing the error.
		//		If everything's fine, its gonna be null
		//
		//	progressCallback
		//		First argument will be downloaded bytes, second is total bytes (may
		// 		be undefined!)

		var plugin = BdApi.getPlugin('Quicksave');
		var settings = plugin.loadSettings();
		var fs = require('fs');
		var dir = settings.direcotry;

		const qs = "[QUICKSAVE]"; // Use as the prefix when logging

		if(!callback) callback = console.error;

		// Removes ":large" from twitter's image urls. Pulled feature.
		var twitterFix = new RegExp(":large$");
		if (twitterFix.test(url)) url = url.replace(twitterFix, '');	

		// Using node apis lets us skip all security built to chrome. This is useful
		// if we want to download from anywhere we want, and we do: Discords rehosts
		// are usually compressed.
		// Can https use http? is this seperation necessary?
		var net = (url.split('//')[0]=='https:') ? require('https') : require('http');


		// TODO: 
		// Make sure we dont download gigabytes
		console.info(`${qs} GET ${url}`);

		const req = net.request(url, (res) => {
			console.info(`${qs} Server responded`, res);
			// REDIRECTIONS
			if(	res.statusCode == 301 // Moved permanently
			 || res.statusCode == 308 // Permanent redirect
			 || res.statusCode == 302 // Found
			 || res.statusCode == 307 // See other
			) {
				
				let newURL = res.headers.location;
				console.info(`${qs} Redirected to ${newURL}`);
				if(!newURL) {
					callback(
						`Redirected with ${res.statusCode}`+
						`but no location header present!`
					);
					console.error(`${qs} No location header in redirection!`);
					return;
				}
				plugin.download(newURL, callback, progressCallback);
				return;
			}

			// Error if not 200
			if(res.statusCode != 200) {
				callback("Server responded with "+ res.statusCode);
				console.error("Response code "+res.statusCode+"", res);
				return;
			}

			// Check content type
			let contentType = res.headers["content-type"];
			if(!contentType){
				callback(`No content-type header present!`);
				console.error(`${qs} No content-type header`);
				return;
			}

			const dropboxSpecialCase = ( url.search('dropbox') > 0 &&
										 contentType.search('binary') > 0 );

			if( contentType.search('image') < 0 && !dropboxSpecialCase) {
				callback(`Content-type '${contentType}' is not an image.`);
				console.error(`${qs} Non-image content-type header!`);
				return;
			}


			var filename = plugin.getFilename(
				{
					plugin:plugin,
					settings:settings,
					url: url,
					dir: dir,
					res: res
				}
			);

			if(!filename) {
		 		callback("Problems with the filename! Check console.");
			 	return;
			}


			console.info(`${qs} SOURCE ${url}`);
			console.info(`${qs} DESTINATION ${dir+filename}`);
			console.info(`${qs} Now downloading...`);

			let total = res.headers["content-length"]; // may be undefined!!
			let bytes = 0;

			// Keep the file fragmented until all chunks are downloaded, then 
			// concat. Moslty because its easy to implement, but also useful if we 
			// don't know the file size in advacne.

			let chunks = [];

			res.on('data', (d) => {
				chunks.push(d);

				bytes+=d.length;
				if(progressCallback) progressCallback(bytes, total);
			});

			res.on('end', ()=> {
				fs.writeFile(dir+filename, Buffer.concat(chunks), (err)=>{
					if(err){
						console.error(err);
						callback(err.message);
					} else {
						console.info(`${qs} File has been successfully written!`);
						if(BdApi.showToast) 
							BdApi.showToast(`Saved as ${dir+filename}`);
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
	}

	getFilename(context){
		const plugin = context.plugin;
		const settings = context.settings;
		const url = context.url;
		const res = context.res; // Node http module response
		const dir = context.dir;

		let fullname = null; // Everything
		let filename = null; // No extension
		let filetype = null; // Only extension

		// Try to find out the real filename. Can be done like so:
		// - From filename[*] field of content-disposition header
		// - From URL

		// ## URL
		// Get the chars after the last / and remove ? and anything after it
		let filename_url = url.split('/').slice(-1)[0].split('?')[0];
		fullname = filename_url.trim();

		// ## HEADER
		// Don't bother with filename*, just keep it simple
		let cd_header = res.headers["content-disposition"];
		if(cd_header){
			let result = cd_header.match(/filename="(.+?)"/);
			if(result[1]) fullname = result[1].trim();
		}

		// Don't write the file without a valid file extension! We need to find it
		// out as well:
		// - From the already extracted filename
		// - (not implemented) From content-type header 
		// - (not implemented) From the magic bytes of the file 
		// Extracting from the filename is easy and works 99% of the time

		filetype = fullname.split('.').slice(-1)[0].trim();

		// Validate file extension
		if(plugin.extensionWhitelist.search(filetype.toLowerCase()) < 0) {
			console.error("Can't find a valid file extension!", context);
			return null;
		}

		filename = fullname.slice(0, -(filetype.length+1));

		// Do user configured renaming here!
		if( settings.namingmethod == "random" ) {
			filename = plugin.randomFilename64(settings.fnLength);
		}

		// SANITIZE THE FILENAME
		// Strip path info, restrict the charset, remove dots or spaces from lead

		filename.split(/[/\\]/).slice(-1)[0].replace(/([^a-z0-9_\-.() ]+)/, '_');

		while( filename.length > 0 && (filename[0] == '.' || filename[0] == ' ') ) 
			filename = filename.slice(1);

		filename = filename.trim();

		if(filename.length === 0) filename = "unknown";

		// Rename to "filename (number).jpg" if file occupied
		let num = 2;
		let maxloops = 99;
		// Using accessSync like this will lock up discord!
		// Possible race condition with other applications between this and actual
		// write in the caller! Use fs.exists!
		while( plugin.accessSync(dir+fullname) && maxloops-- ){
			fullname = filename + ` (${num}).` + filetype;
			num++;
		}

		if(maxloops == -1){
			console.error(
				'No free filename found', context
			);
			return null;
		}
		return fullname;
	}
}
