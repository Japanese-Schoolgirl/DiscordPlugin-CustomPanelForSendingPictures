# 0.6.7
Fixed a display bug with plugin's main button caused by the new Soundmoji button. Also SendTextWithFile setting is now turned on by default.

# 0.6.6
Discord no longer uses the button tag for panel buttons and so the plugin was broken.

# 0.6.5
Sending will no longer ignore a message you are trying to reply to. Also, now prioritizes opened thread's window in case of replies.

# 0.6.4
The "instantBatchUpload" function no longer exists, so it has been replaced with "uploadFiles". Also, text messages are now sent together with images instead of separately.

# 0.6.3
Starting with this version the plugin can work without using ZeresPluginLibrary/0PluginLibrary and in case of anything the plugin now has its own update checker (can be disabled in the settings). As this is a potentially unstable release, it is recommended to backup your settings or roll back to [a previous version](https://github.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/blob/979daac45616c3c42424a39a4b2c2dbef9d3c8c5/CustomPanelForSendingPictures.plugin.js) if necessary.

# 0.6.2
"DiscordSelectors" in 0PluginLibrary stopped working and was replaced.

# 0.6.1
"showAlertModal" no longer works, the function has been replaced by a more cursed counterpart.

# 0.6.0
This update changes the 25 MB limit to 10 MB for "Prevent sending files larger than" option in accordance with the new Discord's policy.

# 0.5.9
Discord replaced "-" in names of classes with "__", which prevented plugin from finding essential elements using selectors. After a quick thought, I just got rid of those spellings, so everything should work now.

# 0.5.8
You can congratulate me, after a year I found a function that allows you to open folders... No idea if it works on Linux or Mac, but at least it's some success! <(─‿‿─)>

# 0.5.7
In the previous update "Buffer" module was replaced with another function with "atob" method. Unfortunately, in the case of some gifs this method caused a crash. There are no such problems when using a third-party library with decode function. For now, I will not overload the plugin by adding new libraries. It will be integrated when the "Buffer" module stops working completely.

# 0.5.6
The deprecated "Buffer" module has been replaced with alternative function.

# 0.5.5
Unfortunately I haven't been able to combine sending a picture with active reply mode, so to avoid new bug the reply mode will be canceled before sending the picture.

# 0.5.4
Added support for an older version of Discord's upload module, because it is not yet updated for everyone.

# 0.5.3
The plugin's upload module has been updated in accordance with the Discord update.

# 0.5.2
Updated the limit setting of sent file size from 8 MB to 25 MB. Note that resizing (option in the plugin's settings) large GIFs may cause freezes and very long uploading.

# 0.5.1
This update should fix some random crashes due to loading of pictures preview. Hope that it will not cause new bugs.

# 0.5.0
The checkbox for a spoiler has been added to the picture panel. If it is checked, then links and files will be sent as spoilers.

# 0.4.9
New Discord update broke the "upload" module, so I replaced it with another.

# 0.4.8
Adds an option to prevent files larger than 8 MB from being sent. It's enabled by default.

# 0.4.7
Now "gifsicle" doesn't cause an error when there are spaces in a file name. Also "refresh" button on the emoji panel no longer creates a copy of it.

# 0.4.6
Fixed a bug with panel disappearing due to Discord's element name change. Also added one new option in settings under the image resizing section that allows to add the subpanel for image resizing to the emoji panel.

# 0.4.5
External module "gifsicle-wasm-browser" is now used instead of "gifsicle.exe".

# 0.4.4
Looks like access to the "child_process" module was irrevocably lost (https://github.com/BetterDiscord/BetterDiscord/issues/1443), so I had to make a compromise method.

# 0.4.3
Fixed sending the original versions of the local files, which was broken by the new horrible Discord update (details in version 0.4.2 changelog).

# 0.4.2 (Hotfix)
There is big issue with new Discord update. It break almost everything. This fix should repair core utilities, but not all. Currently you cannot open folders or resize gifs. You also can read more details here: https://imgur.com/a/SPFvhpZ

# 0.4.1
Changed the plugin's method of checking language and platform.

# 0.4.0
Fixed a fresh issue with not sending files, which happens after Discord updated their "upload" module. Also folder scanning should now become compatible with other OSs.

# 0.3.9
This update should at least temporarily fix the issues related to deletion of DiscordAPI from ZeresLibrary (slightly delayed with the update because I was preparing for upcoming birthday).

# 0.3.8
Fixed incorrect display of the active category when switching categories using buttons on the emoji panel. Issue started to appear in the new version of Discord.

# 0.3.7
Fixed the problem with displaying the animation for preview of loading images. Also made a janky fix for missing color picker in the settings (at the moment this module is broken), but it may require to delete/edit CustomPanelForSendingPictures.configuration or reselect color in the settings.

# 0.3.6
Replaced the function with option for sending messages with images. Also added animation for preview of loading images and content will no longer jump when image previews are loading.

# 0.3.5
Fixed the button missing when the panel is opened.

# 0.3.4
Fixed the issue with selecting Stickers or any additional tab on the panel.

# 0.3.3
Fixed issue with Buffer module.

# 0.3.2
Fixed the plugin functioning with "Preview emojis, mentions, and markdown syntax as you type" Discord beta option. Now messages will be sent without capturing redundant text (when plugin's setting for sending messages together with pictures is turned on).

# 0.3.1
Fixed the plugin functioning with "Preview emojis, mentions, and markdown syntax as you type" Discord beta option. Now messages will be sent regardless of this option, but if this beta function is turned on, then messages will not have a markdown in them because of it.

# 0.3.0
Now Repeat last sent picture option will not send a picture for the entire time the key is pressed, now it requires releasing "V" key.

# 0.2.9
Fixed for Powercord (with BDCompat).

# 0.2.8
Checkboxes now work correctly.

# 0.2.7
Code is improved a little. Also added temporary fix for ZeresPluginLibrary (checkboxes now displayed as sliders).

# 0.2.6
Added option for automatic proportional scaling of pictures from local or web files to set size. Animation pictures included with sub-option.

# 0.2.5
Added search bar for pictures in the panel.

# 0.2.4
Now failing to load local and web files will be displayed with error preview that will not be clickable. Also fixed background CSS.

# 0.2.3
From now on file previews in the panel will be loaded asynchronously, which solves problem with visual freeze in case of large folders. However, still try to avoid using folders with big amount of pictures, see TODO for details.

# 0.2.2
Corrected buttons style with large font-size.

# 0.2.1
Improved button design and added 1 new button with method for opening the Main folder method on the picture panel.

# 0.2.0
Now webp filetype is allowed to be scanned too.

# 0.1.9
Made more reliable use of libraries and corrected code a little.

# 0.1.8
Removed unnecessary pieces of code, and scan function is now working better now than before.

# 0.1.7
Added RU localization for everything expect changelogs. Also from now on picture's name will be displayed when mouse is over its preview.

# 0.1.6
Fixed emtpy folder in subfolder bug and added following options: ability to Repeat last sent, Auto close panel, Sending file cooldown, to change Main folder path and Main folder display name.

# 0.1.5
Discord has very weird checks for messages, so it was necessary to add other checks.

# 0.1.4
Fixed issue with clicking between gif and emojis button after picture button +other small changes.

# 0.1.3
Added settings for color selection of section's name and settings for sending text before the file.

# 0.1.2
From now on instead of "config" for configuration file using "configuration" in the name.

# 0.1.1
It should fix issue with scanning system which sometimes happens.

# 0.1.0
Better sections/groups name display and fixed refresh button for OnlyForcedUpdate option.

# 0.0.9
Fixed some bugs with subfolders and reorganized config files + some small additional fixes.

# 0.0.8
Fixed display of selected button and bug with disappearing click on previous button.

# 0.0.7
From now on subfolders will be displayed as sections/groups in the panel.

# 0.0.6
Slightly changed structure. The plugin should start working more stable.

# 0.0.5
Fixed styles behaviour.

# 0.0.4
Fixed board size.

# 0.0.3
Added scroller and fixed resize bugs.

# 0.0.2
Corrected main functionality and fixed plugin's info.

# 0.0.1
Added main functionality.