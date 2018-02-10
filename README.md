# Quicksave-BD-plugin
This is a plugin for BetterDiscord.

### What does it do?
Adds saving buttons to images. These will download the images from their original urls and save them on disk.

![img](https://kosshi.fi/u/YiKB.png)
![img](https://kosshi.fi/u/7ktC.png)

### How to install?
1. Make sure you have native Discord application installed with [BetterDiscord](https://betterdiscord.net)
2. Locate the BetterDiscord plugin folder
  * %appdata%/BetterDiscord/plugins
  * or Settings>BetterDiscord>Plugins>Open Plugin Folder
3. Copy file 'Quicksave.plugin.js' to the plugin folder
4. Reload/restart Discord (CTRL+R)
5. Go to Settings>BetterDiscord>Plugins
6. Enable this plugin
7. Go to the plugin settings and set a download directory.


### Warnings
- The plugin will download images from their original URLs. This is done because Discord rehosted images are usually compressed.
- This will reveal your IP address to the server when downloading.
- The plugin doesn't do much checking of the filename or file contents, only content-type header is looked at. 
- It may write filenames without extensions, odd symbols or other filename wierdness that will confuse Windows.
- Because of the direct download, the server can send anything it wants. [Even viruses](https://stackoverflow.com/questions/9675941/how-can-a-virus-exist-in-an-image). Tho as long as you dont execute them or use image viewers from last millenia, you should be fine.
- MIT license. Use at your own risk. 
