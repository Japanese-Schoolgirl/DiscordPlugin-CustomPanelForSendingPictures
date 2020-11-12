# Introduction:
This plugin was written for my own use and for people I'm communicating with. But since plugin can be useful for someone else I'm uploading it here. In case you want to rewrite this plugin (and considering my inexperience, you probably should) also check the licence file.<br />

P.S. I rarely use GitHub, so it is my first time in dealing with such project. Don't be surprised with some weirdness regarding commits etc. Also my native language isn't English so there may be mistakes in wording.<br />

# Plugin description
This plugin adds special "Pictures" button to the right of Emojis selection button. Clicking that button will load a panel which contents are loaded from special folder that is created by this plugin. The folder is scanned for files of following types: ".jpg", ".jpeg", ".bmp", ".png", ".gif", ".src", ".sent".<br />
Files of ".src" and ".sent" types are JSON files and contain a link to the web file.<br />
After the scan panel will show previews of all your files in the folder. After clicking a file in this panel you'll immediately send picture file (or a link of picture in case of ".src" and ".sent") to currently opened Discord chat.<br />
Files of ".sent" type will replace files with identical name and extension. ".sent" files will automatically generate after sending local files and will be used if you have enabled corresponding setting.<br />
### Work Example:
![Work example](https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/Previews/WorkExample.gif)
Starting from version 0.0.7 this **plugin will search for and scan subfolders placed in the main folder. Content of these folders will be displayed as sections/groups in the panel itself**. Subfolders inside subfolders will not be scanned. It is also *not recommended* to store 300+ images of large size as it will affect speed of panel loading.<br />
### Configuration menu:
![Configuration menu](https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/Previews/Settings_EN.png)


# Compatability:
I use [EnhancedDiscord](https://github.com/joe27g/EnhancedDiscord) and can only track problems that appears there. Even though, the plugin should function correctly with BetterDiscord, since it was made as a [BetterDiscord](https://github.com/rauenzi/BetterDiscordApp) plugin.<br />
Plugin also uses [Zere's Plugin Library](https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js).<br />

# Installation
1) Install [EnhancedDiscord](https://enhanceddiscord.com/EnhancedDiscord.exe) or [BetterDiscord](https://github.com/rauenzi/BBDInstaller/releases/latest/download/BandagedBD.exe);<br />
2) Place [Zere's Plugin Library](https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js) file into your plugin folder;<br />
3) Place plugin's ".js" file into your plugin folder;<br />
4) After enabling the plugin, it will create a new folder in your plugin folder, in which you need to move images that you want to use.<br />
<br />P.S. Plugin will save all information about folder's contents in CustomPanelForSendingPictures.settings.json file, and your plugin settings in CustomPanelForSendingPictures.config.json (you can also delete those files to reset all settings).<br />

# Support:
If you'd want to help me with this janky project, check the [TODO](https://github.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures#todo), where I've listed problems that I'm trying to solve at the moment. You can check [Communication](https://github.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures#communication) section for ways of contacting me.<br />
If you'd like to help me financially, here are my requisites:<br />
https://donate.qiwi.com/payin/Schoolgirl<br />
https://www.donationalerts.com/r/JapaneseSchoolgirl<br />

# Communication:
I don't accept unknown friend requests, so if you want to DM me in Discord there is a huge chance I won't notice you. It's better to use GitHub or [Steam](https://steamcommunity.com/id/EternalSchoolgirl/) to contact me (its not necessary to add me, I have open comment section). I also have [Discord Server](https://discord.gg/nZMbKkw), but it has a manual approval of every user before they are allowed to write or read most of conversation channels. You can also try to write me on [Twitch](https://www.twitch.tv/EternalSchoolgirl), but it's not the most convenient way.<br />

# Utilities:
- To resize pictures and compress them to a smaller size in selected folder (to optimize your pictures list more), you can use [FastStone Photo Resizer](https://www.faststone.org/FSResizerDownload.htm) (better to not compress gifs with this program) or similar;<br />
- There is an [archive](https://yadi.sk/d/uCV9ajPOmcLXHA) with some of previously global emojis saved, if you need to add more pictures.<br />

# TODO:
- ".sent" files aren't generating automatically, it's caused by inability to get a link by sent file's ID (because file sending doesn't return an ID):<br />