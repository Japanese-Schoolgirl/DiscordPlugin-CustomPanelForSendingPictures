# Introduction:
This plugin was written for my own use and for people I'm communicating with. But since plugin can be useful for someone else I'm uploading it here. In case you want to rewrite this plugin (and considering my inexperience, you probably should) also check the license file.<br />

P.S. I rarely use GitHub, so it is my first time in dealing with such a project. Don't be surprised about some weirdness regarding commits etc. Also my native language isn't English so there may be mistakes in wording.<br />

# Plugin description
This plugin adds a special "Pictures" button to the right of Emojis selection button. Clicking that button will load a panel which's contents are loaded from special folder that is created by this plugin. The folder is scanned for files of the following types: ".jpg", ".jpeg", ".bmp", ".png", ".webp", ".gif", ".src", ".sent".<br />
Files of ".src" and ".sent" types are JSON files and contain a link to the web file (content example: "https://i.imgur.com/l5Jf0VP.png").<br />
After the scan the panel will show previews of all your files in the folder. After clicking a file in this panel you'll immediately send a picture file (or a link of picture in case of ".src" and ".sent") to currently opened Discord chat.<br />
Files of ".sent" type will replace files with identical name and extension. ".sent" files will be automatically generated after sending local files and will be used if you have enabled corresponding setting.<br />
Starting from version 0.0.7 this **plugin will search for and scan subfolders placed in the main folder. Content of these folders will be displayed as sections/groups in the panel itself**. Subfolders inside subfolders will not be scanned. It is also *not recommended* to store 300+ images as it will affect speed of panel loading (file size doesn't matter).<br />
### Preview of the latest update:
![Preview of the latest update](https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/Previews/Overall.png)
### Work Example:
![Work example](https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/Previews/WorkExample.gif)
Changes not displayed in the gif above: improved buttons design, added 1 new button (opens Main folder) in the pictures panel, added asynchronous pictures loading to the panel, added displaying error handler when loading local or web files failed, added an option for automatic proportional scaling of pictures from local or web files to set size.<br />
Also search through pictures was added and it is shown in the gif below:<br />
### Search bar:
![Search bar](https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/Previews/SearchBar.gif)
### Configuration menu:
![Configuration menu](https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/Previews/Settings_EN.png)

# Compatibility:
Plugin should be completely compatible with native and any of user themes, as it uses default Discord colour variables.<br />
I use [BetterDiscord](https://github.com/BetterDiscord/BetterDiscord) and can only track problems that appears there.<br />
The plugin uses external library [gifsicle-wasm-browser](https://unpkg.com/gifsicle-wasm-browser@1.5.16/dist/gifsicle.min.js) to resize gifs.<br />
Performance on operating systems other than Windows was not tested, it is likely that some functionality may not works on a different OS.<br />

# Installation
1) Install [BetterDiscord](https://github.com/rauenzi/BBDInstaller/releases/latest/download/BandagedBD.exe);<br />
2) Place plugin's "[.js](https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/CustomPanelForSendingPictures.plugin.js)" file into your plugin folder;<br />
3) After enabling the plugin, it will create a new folder in your plugin folder, in which you need to move images that you want to use.<br />
<br />P.S. Plugin will save all information about folder's contents in CustomPanelForSendingPictures.settings.json file, and your plugin configuration in CustomPanelForSendingPictures.configuration.json (you can also delete those files to reset all settings).<br />

# Support:
If you'd want to help me with this janky project, check the [TODO](https://github.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures#todo), where I've listed problems that I'm trying to solve at the moment. You can check [Communication](https://github.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures#communication) section for ways of contacting me.<br />

# Communication:
I don't accept unknown friend requests, so if you want to DM me in Discord there is a huge chance I won't notice you. It's better to use GitHub or [Steam](https://steamcommunity.com/id/EternalSchoolgirl/) to contact me (its not necessary to add me, I have open comment section). I also have [Discord Server](https://discord.gg/nZMbKkw), but it has a manual approval of every user before they are allowed to write or read most of conversation channels. You can also try to write me on [Twitch](https://www.twitch.tv/EternalSchoolgirl), but it's not the most convenient way.<br />

# Utilities:
- [Changelog](https://github.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/blob/main/Changelog.md);<br />
- To resize pictures and compress them to a smaller size in selected folder (to optimize your pictures list more), you can use [FastStone Photo Resizer](https://www.faststone.org/FSResizerDownload.htm) (better to not compress gifs with this program) or similar;<br />
- There is an [archive](https://mega.nz/folder/c3YSmJYb#vF9iswDuT0YqOreDA9KL-g) with some of previously global emojis saved, if you need to add more pictures.<br />

# TODO (and known issues):
(Some of these items are put on hold, because I wasn't able to find a way to "handle" sending messages)<br />
— Fix the option for sending message with file, which sends messages without the markdown;<br />
— Improve sending images and messages in a not fully opened message's thread. Currently, sending images and messages only prioritize thread's window in case of replies. The main chat window will be prioritized in other cases;<br />
— Add support for proportional scaling of **animated** .png (.apng) (this task has low priority since Discord cannot properly display them at the moment).<br />
