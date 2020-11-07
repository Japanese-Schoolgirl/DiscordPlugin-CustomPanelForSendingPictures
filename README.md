# Introduction: 
This plugin was written for my own use and for people I'm communicating with. But since plugin can be useful for someone else I'm uploading it here. In case you'd want to rewrite this plugin (and considering my inexperience, you probably should) also check the licence file.
Also my native language isn't English so there may be mistakes in wording.

# Plugin description
This plugin adds special "Pictures" button to the right of Emojis selection button. Clicking that button will load a panel which contents are loaded from special folder that is created by this plugin. The folder is scanned for files of following types: ".jpg", ".jpeg", ".bmp", ".png", ".gif", ".src", ".sent".
Files of ".src" and ".sent" types are JSON files and contain a link to the web file.
After the scan panel will show previews of all your files in the folder. After clicking a file in this panel you'll immediately send picture file (or a link of picture in case of ".src" and ".sent") to currently opened Discord chat.
Files of ".sent" type will replace files with identical name and extension. ".sent" files will automatically generate after sending local files and will be used if you have enabled corresponding setting.
### Work Example:
![Work Example](https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/Previews/WorkExample.gif)
### Configuration menu:
![Configuration menu](https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/Previews/Settings.png)


# Compatability:
I use [EnhancedDiscord](https://github.com/joe27g/EnhancedDiscord) and can only track problems that appears there. Even though, the plugin should function correctly with BetterDiscord, since it was made as a [BetterDiscord](https://github.com/rauenzi/BetterDiscordApp) plugin.
Plugin also uses [Zere's Plugin Library](https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js).

# Installation
1) Place plugin's ".js" file into your plugin folder;
2) After enabling the plugin, it will create a new folder in your plugin folder.
P.S. Plugin will save all information about folder's contents in CustomPanelForSendingPictures.settings.json file, and your plugin settings in CustomPanelForSendingPictures.config.json (you can also delete those files to reset all settings);

# Support:
If you'd want to help me with this janky project, check the TODO, where I've listed problems that I'm trying to solve at the moment. You can check **Communication** section for ways of contacting me.
If you'd like to help me financially, here are my requisites:
https://donate.qiwi.com/payin/Schoolgirl
https://www.donationalerts.com/r/JapaneseSchoolgirl

# Communication: 
I don't accept unknown friend requests, so if you want to DM me in Discord there is a huge chance I won't notice you. It's better to use GitHub or [Steam](https://steamcommunity.com/id/EternalSchoolgirl/) to contact me (its not necessary to add me, I have open comment section). I also have [Discord Server](https://discord.gg/nZMbKkw), but it has a manual approval of every user before they are allowed to write or read most of conversation channels 

# TODO: 
- ".sent" files aren't generating automatically, it's caused by inability to get a link by sent file's ID (because file sending doesn't return an ID):
- Configuration parsing is a bit janky, I'd like to fix it ASAP;
- Code should be reorganized, sometimes it reacts weirdly to multiple reloads and it has plenty of room for optimization;