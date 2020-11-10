/**
 * @name CustomPanelForSendingPictures
 * @authorName Japanese Schoolgirl (Lisa)
 * @invite nZMbKkw
 * @authorLink https://github.com/Japanese-Schoolgirl
 * @donate https://donate.qiwi.com/payin/Schoolgirl
 * @website https://github.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures
 * @source https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/CustomPanelForSendingPictures.plugin.js
 */

module.exports = (() =>
{
/*========================| Info |========================*/
	const config =
	{
		info:
		{
			name: "CustomPanelForSendingPictures",
			author:
			{
					name: "Japanese Schoolgirl (Lisa)",
					github_username: "Japanese-Schoolgirl",
					discord_server: "https://discord.gg/nZMbKkw",
					steam_link: "https://steamcommunity.com/id/EternalSchoolgirl/",
					twitch_link: "https://www.twitch.tv/EternalSchoolgirl"
			},
			version: "0.1.3",
			description: "Adds panel which load pictures by links from settings and allow you to repost pictures via clicking to their preview. Links are automatically created on scanning the plugin folder (supports subfolders and will show them as sections/groups).",
			github: "https://github.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures",
			github_raw: "https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/CustomPanelForSendingPictures.plugin.js"
		},
		changelog:
		[
			{
				title: `Added settings for color selection and sending text before the file`,
				type: "fixed",
				items: [`Added settings for color selection of section's name and settings for sending text before the file.`]
			}
		]
	};
/*========================| Modules |========================*/
	const fs_ = window.require('fs');
	const path_ = window.require('path');
	const uploadModule = window.BdApi.findModule(m => m.upload && typeof m.upload === 'function'); // Module from BdApi for uploading files, can be replaced

/*========================| Core |========================*/
	//-----------| Check at ZeresPlugin Library |-----------//
	return !global.ZeresPluginLibrary ? class {
		constructor() { this._config = config; }

		getName() {return config.info.name;}
		getAuthor() {return config.info.author.name;}
		getVersion() {return config.info.version;}
		getDescription() {return config.info.description;}

		load()
		{
			BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
				confirmText: "Download Now",
				cancelText: "Cancel",
				onConfirm: () => {
					require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (err, res, body) => {
						if (err) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
						await new Promise(r => fs_.writeFile(path_.join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
					});
				}
			});
		}

		start() { }
		stop() { }
	} : (([Plugin, Api]) =>
	{
		const plugin = (Plugin, Api) =>
		{

			const { Patcher, DiscordAPI, DiscordModules, Settings, PluginUtilities } = Api;
	//-----------| Create Settings and Variables |-----------//
			var picsGlobalSettings = {};
			var pluginPath, settingsPath, configPath, picturesPath;
			pluginPath = __dirname.indexOf('\\electron.asar\\') != -1 ? __dirname.split('app-')[0] : __dirname + '\\';
			settingsPath = pluginPath + config.info.name + '.settings.json';
			configPath = pluginPath + config.info.name + '.configuration.json';
			picturesPath = pluginPath + config.info.name + '\\';
			let sentType = '.sent';
			let srcType = '.src';
			let mainFolderName = 'Main folder';
			let folderListName = `?/\\!FolderList!/\\?`;
			var Configuration = {
				UseSentLinks:			{ Value: true, 					Title: `Use Sent Links`, 								Description: `To create and use .sent files that are replacing file sending by sending links.` },
				SendTextWithFile:		{ Value: false, 				Title: `Send text from textbox before sending file`, 	Description: `To send text from textbox before sending web or local file. Doesn't delete text from textbox. Doesn't send message over 2000 symbols limit.` },
				OnlyForcedUpdate:		{ Value: false, 				Title: `Only Forced Update`, 							Description: `Doesn't allow plugin to automatically update settings with used files without user interaction.` },
				sentType2srcType:		{ Value: false, 				Title: `Treat ${sentType} as ${srcType}`, 				Description: `To use ${sentType} as ${srcType}.` },
				SectionTextColor:		{ Value: 'color: #000000bb', 	Title: `Section's name color`, 							Description: `Your current color is:` }
			};
	//-----------|  Start of Styles section |-----------//
			var CPFSP_Styles = () => { return ` /* Extract from "emojiList" and etc classes + additional margin and fixes */
#CPFSP_Panel {
	grid-row: 2/2;
	overflow: hidden;
	position: relative;
}
.CPFSP_List {
	top: 30px;
	right: 0px;
	bottom: 8px;
	left: 8px;
	position: absolute;
	overflow: hidden scroll;
	padding-right: 5px;
}
.CPFSP_Section {
	height: 100%;
	margin-bottom: 12px;
	margin-left: 18px;
	font-size: 18px;
	font-weight: 600;
	color: ${Configuration.SectionTextColor.Value}; /* color: var(--header-primary); */
	text-shadow: 0px 0px 5px white, 0px 0px 10px white, 0px 0px 5px black, 0px 0px 10px black, 0px 0px 1px purple;
}
.CPFSP_ul {
	/*
	height: 56px;
	display: inline-block;
	grid-auto-flow: column;
	grid-template-columns: repeat(auto-fill,56px);
	*/
}
.CPFSP_li {
	display: inline-block;
	margin: 5px 0px 0px 5px;
}
.CPFSP_IMG {
	height: 48px;
	width: 48px;
	cursor: pointer;
	background-size: 48px;
}
.CPFSP_btnRefresh {
	height: 30px;
	line-height: 32px;
	cursor: pointer;
	color: var(--text-normal);
	background-color: var(--background-tertiary);
	text-align: center;
	min-width: 48px;
}
#CPFSP_Button {
	
}
.CPFSP_activeButton {
	background-color: var(--background-accent);
	color: #fff;
}
			`};
			var elementNames = {
				id: 					'CPFSP_StyleSheet',
				CPFSP_panelID: 			'CPFSP_Panel',
				CPFSP_buttonID: 		'CPFSP_Button',
				CPFSP_activeButton: 	'CPFSP_activeButton',
				elementList: 			'CPFSP_List',
				folderSection:			'CPFSP_Section',
				elementRow: 			'CPFSP_ul',
				elementCol: 			'CPFSP_li',
				newPicture: 			'CPFSP_IMG',
				buttonRefresh: 			'CPFSP_btnRefresh'
			}
			var funcs_ = {}; // Object for store all custom functions
	//-----------|  End of Styles section |-----------//

	//-----------|  Functions |-----------//
			funcs_.setStyles = (command = null) =>
			{
				if(document.getElementById(elementNames.id) && command == 'delete') { return document.getElementById(elementNames.id).remove(); }
				if(document.getElementById(elementNames.id)) { return }
				let pluginStyles = document.createElement('style');
				pluginStyles.setAttribute('id', elementNames.id);
				pluginStyles.innerHTML = CPFSP_Styles();
				return document.body.append(pluginStyles);
			}
			funcs_.saveSettings = (data, once = null) =>
			{
				if(Object.keys(data).length < 2) { return funcs_.loadDefaultSettings(); } // This happen when folder is empty
				//if(!Array.from(data).length) { return funcs_.loadDefaultSettings(); } // This happen when folder is empty
				fs_.writeFile(settingsPath, JSON.stringify(data), function(err)
				{
					if(err)
					{
						console.warn('There has been an error saving your settings data:', err.message);
					}
				});
				if(once) { return picsGlobalSettings; } // to avoid endless engine
				return funcs_.loadSettings();
				// DEBUG // console.log('Path: ', __dirname);
			}
			funcs_.loadSettings = (waitPLS = null, anotherTry = null) =>
			{
				/*if(waitPLS)
				{ // DEPRECATED //
					if(waitPLS.state() != 'resolved') { setTimeout(()=> { return funcs_.loadSettings(waitPLS); }, 100) }
					//waitPLS.promise().always(()=>{console.log('well')});
				}*/
				if(waitPLS) { return waitPLS.state(); } // Sorry, I couldn't find a better way to make the waiting while file saving and loading
				let newPicsGlobalSettings = {};
				if(!fs_.existsSync(settingsPath)) { return funcs_.loadDefaultSettings(); } // This happen when settings file doesn't exist
				try { newPicsGlobalSettings = JSON.parse(fs_.readFileSync(settingsPath)); }
				catch(err)
				{
					console.warn('There has been an error parsing your settings JSON:', err.message);
					if(!anotherTry) { return funcs_.loadSettings(null, true) }
					return picsGlobalSettings;
				}
				if(!Object.keys(newPicsGlobalSettings).length) { return funcs_.loadDefaultSettings(); }  // This happen when settings file is empty
				picsGlobalSettings = newPicsGlobalSettings;
				window.q = newPicsGlobalSettings;
				return picsGlobalSettings;
			}
			funcs_.loadDefaultSettings = () =>
			{
				picsGlobalSettings = {};
				picsSettings = [ { name: 'AnnoyingLisa', link: 'https://i.imgur.com/l5Jf0VP.png' }, { name: 'AngryLisaNoises', link: 'https://i.imgur.com/ntW5Vqt.png'} ]; // Placeholder
				picsGlobalSettings[folderListName] = [ { name: mainFolderName, path: picturesPath } ];
				picsGlobalSettings[mainFolderName] = picsSettings;
				//funcs_.saveSettings(picsGlobalSettings);
				funcs_.saveSettings(picsGlobalSettings, true);
				return picsGlobalSettings;
			}
			funcs_.loadConfiguration = () =>
			{
				let newData;
				if(!fs_.existsSync(configPath)) { return } // This happen when settings file doesn't exist
				try { newData = JSON.parse(fs_.readFileSync(configPath)); }
				catch(err) { console.warn('There has been an error parsing your config JSON:', err.message); return }
				if(!newData || !Object.keys(newData).length) { return }  // This happen when settings file is empty
				Object.keys(Configuration).forEach((key) =>
				{
					if(!newData[key]) { return };
					Configuration[key].Value = newData[key];
				});
			}
			funcs_.saveConfiguration = () =>
			{
				let exportData = {};
				Object.keys(Configuration).forEach((key) =>
				{
					exportData[key] = Configuration[key].Value;
				});
				fs_.writeFile(configPath, JSON.stringify(exportData), function(err)
				{
					if(err)
					{
						return console.warn('There has been an error saving your config data:', err.message);
					}
				});
				funcs_.loadConfiguration();
			}
			funcs_.scanDirectory = (forced = null, repeat = null) =>
			{ // Scanning plugin folder
				if((Configuration.OnlyForcedUpdate.Value && !forced) && !repeat) { return funcs_.loadSettings(); }
				if(fs_.existsSync(picturesPath))
				{ // Exist
					let waitPLS = jQuery.Deferred(); // First time when I uses this
					waitPLS.promise();
					funcs_.findPictures(picturesPath, waitPLS);
					return funcs_.loadSettings(waitPLS); // funcs_.findPictures will store data in picsGlobalSettings, so with state it possible to decide when new data is received
				}
				else
				{ // Not Exist
					try { fs_.mkdirSync(picturesPath); } // Create folder
					catch (err) { console.warn(err.code); }
					if(!repeat) { funcs_.scanDirectory(forced, true); } // Fixed issue with necessary double scan when user delete folder
					return false
				}
			}
			funcs_.findPictures = (scanPath, readyState = null, newAllPicsSettings = {}, folderName = null, foldersForScan = [], emtpyFoldersList = []) =>
			{ // Scanning for pictures in select folder, "foldersForScan" store folders from plugin directory
				let newPicsSettings = [];
				let isFirstScan = !folderName; // !(Object.keys(newAllPicsSettings).length);
				if(!scanPath) { return funcs_.loadSettings(); }
				if(!fs_.existsSync(scanPath)) { return funcs_.loadSettings(); }
				if(!folderName) { folderName = mainFolderName; }
				// function getDirs(scanPath) { return fs_.readdirSync(scanPath).filter(file => fs_.statSync(path_.join(scanPath, file)).isDirectory()); }
				fs_.readdir(scanPath, function(err, files)
				{
					if(err) { console.warn('Unable to scan directory:' + err); return funcs_.loadSettings(); }
					let alreadySentFiles = [];
					if(isFirstScan) { foldersForScan.push({ name: mainFolderName, path: picturesPath }); } // Adds necessary information about main folder
					if(isFirstScan) { newAllPicsSettings[folderListName] = foldersForScan; } // Unnecessary reordering fix?
					let currentFolder = isFirstScan ? mainFolderName : folderName; // Get name of current folder
					let index = 0;
					files.forEach((file, absoluteIndex) =>
					{
						let isFolder = fs_.statSync(path_.join(scanPath, file)).isDirectory();
						let fileTypesAllow = ['.jpg', '.jpeg', '.bmp', '.png', '.gif', srcType, sentType];
						let fileType = path_.extname(file).toLowerCase();
						let filePath = scanPath + file;
						let webLink;
						if(isFolder && isFirstScan) { foldersForScan.push({name: file, path: (path_.join(scanPath, file) + '\\') }); } // Add each folder only in this cycle due isFirstScan there prevents scans subfolders in subfolders. However this code not organize for subsubsubsubfolders scan yet
						if(isFolder && isFirstScan && !absoluteIndex) { newPicsSettings[index] = { name: 'Placeholder', link: 'https://i.imgur.com/ntW5Vqt.png?AlwaysSendThisImageToNextUniverse/\\?????' }; } // Adds as placeholder only once due Main folder can't be "emtpy"
						if(fileTypesAllow.indexOf(fileType) == -1) { return } // Check at filetype
						if(fileType == sentType || fileType == srcType)
						{
							try { webLink = JSON.parse(fs_.readFileSync(filePath)); }
							catch(err) { console.warn(`There has been an error parsing ${sentType} file:`, err.message); return }
							if(Configuration.sentType2srcType.Value) { fileType = srcType; }
						}
						if(fileType == sentType)
						{
							if(!Configuration.UseSentLinks.Value) { return } // Doesn't uses this files type if user don't turn on it
							alreadySentFiles.push({ name: file, link: webLink });
							return
						}

						if(fileType == srcType) { newPicsSettings[index] = { name: file, link: webLink }; }
						else if(fileTypesAllow.indexOf(fileType) != -1) { newPicsSettings[index] = { name: file, link: 'file:///' + filePath }; }
						index++; // Index will increase ONLY if file is allowed
					});
					// DEBUG // console.log(newPicsSettings);
					// DEBUG // console.log(alreadySentFiles);
					alreadySentFiles.forEach((file) =>
					{ // Replace all local links with web links
						let found = newPicsSettings.find(el => el.name == file.name.slice(0, -sentType.length));
						if(found) { found.link = file.link; }
					});
					if(!Object.keys(files).length)
					{ // Delete empty folder from list and refresh list
						//foldersForScan.splice(foldersForScan.findIndex((el) => el.name == currentFolder), 1); // Didn't work properly
						//foldersForScan.find((el) => el.name == currentFolder).name = 'undefined';
						//newAllPicsSettings[folderListName] = foldersForScan;
						//Variants above don't work correctly
						emtpyFoldersList.push(foldersForScan.find((el) => el.name == currentFolder));
					}
					if(Object.keys(newPicsSettings).length) { newAllPicsSettings[currentFolder] = newPicsSettings; } // Prevents adding empty folder
					if(Object.keys(foldersForScan).length)
					{ // There subfolders scan request
						if(isFirstScan) { newAllPicsSettings[folderListName] = foldersForScan; } // isFirstScan there prevents scans subfolders in subfolders. However this blah blah blah I already said this
						let needSkip;
						foldersForScan.some((folder, folderIndex) =>
						{
							if(currentFolder == folder.name && folderIndex < Object.keys(foldersForScan).length-1) // it is X < X, where X count of folders
							{
								funcs_.findPictures(foldersForScan[folderIndex+1].path, readyState, newAllPicsSettings, foldersForScan[folderIndex+1].name, foldersForScan, emtpyFoldersList);
								return (needSkip = true);
							}
						});
						if(needSkip) { return false } // If funcs_.findPictures used inside itself then this method will end there
					}
					// DEBUG // console.log(folders, newAllPicsSettings, newPicsSettings, isFirstScan);
					emtpyFoldersList.forEach((emtpyFolder) =>
					{
						newAllPicsSettings[folderListName].splice(newAllPicsSettings[folderListName].findIndex((folder) => folder.name == emtpyFolder.name && folder.path == emtpyFolder.path), 1);
					});
					try
					{ // Remove placeholder and delete Main folder from section. This happen if in Main folder only folders with pictures
						if((1 < newAllPicsSettings[folderListName].length) && (newAllPicsSettings[mainFolderName].length < 2))
						{
							let placeholder = newAllPicsSettings[mainFolderName][0];
							if((placeholder.name === 'Placeholder') && (placeholder.link === 'https://i.imgur.com/ntW5Vqt.png?AlwaysSendThisImageToNextUniverse/\\?????'))
							{
								newAllPicsSettings[folderListName].splice([newAllPicsSettings[folderListName].findIndex((el) => el.name == mainFolderName)], 1);
								delete newAllPicsSettings[mainFolderName];
							}
						}
					} catch(err) { console.warn(err); }
					readyState.resolve();
					return funcs_.saveSettings(newAllPicsSettings); // Apply new settings
				});
			}
			funcs_.moveToPicturesPanel = (elem = null, once = null) =>
			{ // once for funcs_.scanDirectory and waitingScan check
				let command = elem == 'refresh' ? 'refresh' : elem ? elem.target.getAttribute('command') : null;
				let buttonCPFSP = document.getElementById(elementNames.CPFSP_buttonID);
				if(!buttonCPFSP) { return }
				let emojisGUI = buttonCPFSP.parentNode.parentNode.parentNode; // Up to "contentWrapper-"
				let emojisPanel = emojisGUI.querySelector('div[role*="tabpanel"]'); // Emojis panel
				if(!emojisPanel) { return }
				let allPicsSettings;
				function creatingPanel()
				{
					allPicsSettings = funcs_.loadSettings();
					if((document.getElementById(elementNames.CPFSP_panelID) && command != 'refresh')) { return } // Will repeat if command == refresh
					emojisPanel.innerHTML = ''; // Clear panel
					emojisPanel.setAttribute('id', elementNames.CPFSP_panelID); // Change panel ID
					buttonCPFSP.classList.add(elementNames.CPFSP_activeButton); // Add CSS for select
					let previousButton = document.getElementById(buttonCPFSP.getAttribute('from'));
					try
					{ // Unselecting previous button
						previousButton.querySelector('button').classList.value = previousButton.querySelector('button').classList.value.replace('ButtonActive', 'Button');
					} catch(err) { console.warn(err); }

					let elementList = document.createElement('div');
					let folderSection = document.createElement('div');
					elementList.setAttribute('class', elementNames.elementList);
					folderSection.setAttribute('class', elementNames.folderSection);
					let elementRow = document.createElement('ul');
					let rowIndex = 1;
					let colIndex = 1;
					let currentSection;
					function setCurrentSection(folder)
					{ // Sets name to section with uses variables above
						currentSection = folder.name;
						folderSection.append(document.createElement('text').innerText = currentSection);
					}
					// DEBUG // console.log(allPicsSettings);
					allPicsSettings[folderListName].forEach((folder, indexFolder) =>
					{
						allPicsSettings[folder.name].forEach((file, indexFile)=>
						{
							if(indexFolder === 0 && indexFile === 0) { setCurrentSection(folder); } // Set first section for first element
							if(currentSection != folder.name)
							{
								folderSection.append(elementRow); // Adds emojis to special section before section change
								rowIndex++;
								colIndex = 1;
								setCurrentSection(folder);
								elementRow = document.createElement('ul');
							}
							elementRow.setAttribute('class', elementNames.elementRow);
							elementRow.setAttribute('role', 'row');
							elementRow.setAttribute('aria-rowindex', rowIndex);

							let elementCol = document.createElement('li');
							elementCol.setAttribute('class', elementNames.elementCol);
							elementCol.setAttribute('role', 'gridcell');
							elementCol.setAttribute('aria-rowindex', rowIndex);
							elementCol.setAttribute('aria-colindex', colIndex);
							let newPicture = document.createElement('img');
							newPicture.setAttribute('path', file.link);
							try
							{
								if(file.link.indexOf('file:///') != -1)
								{ // Convert local file to base64 for preview
									newPicture.setAttribute('src', `data:image/${path_.extname(file.link)};base64,${new Buffer(fs_.readFileSync(file.link.replace('file:///', ''))).toString('base64')}`);
								}
								else { newPicture.setAttribute('src', file.link); }
							} catch(err)
							{ /* console.warn('There is problem with links:', err); */ }
							newPicture.setAttribute('aria-label', file.name);
							newPicture.setAttribute('alt', file.name);
							newPicture.setAttribute('class', elementNames.newPicture);
							newPicture.addEventListener('click', funcs_.send2ChatBox);
							elementCol.append(newPicture); // Adds IMG to "li"
							elementRow.append(elementCol); // Adds "li" to "ul"
							colIndex++;
						});
						folderSection.append(elementRow); // Adds emojis to special section
						elementList.append(folderSection); // Adds all sections to list
					});
					emojisPanel.append(elementList); // Adds list to panel 

					let buttonRefresh = document.createElement('div'); // Refresh button
					buttonRefresh.setAttribute('class', elementNames.buttonRefresh);
					buttonRefresh.setAttribute('command', 'refresh');
					buttonRefresh.innerText = 'Refresh';
					buttonRefresh.removeEventListener('click', funcs_.moveToPicturesPanel); // Insurance
					buttonRefresh.addEventListener('click', funcs_.moveToPicturesPanel);
					emojisPanel.insertBefore(buttonRefresh, emojisPanel.firstChild); // Adds button to panel
				}
				$.when($.ajax(allPicsSettings = funcs_.scanDirectory(command))).then(function()
				{
					// console.log(allPicsSettings == 'pending') not stable
					allPicsSettings = funcs_.loadSettings();
					creatingPanel();
					if(!once) { setTimeout(()=> { funcs_.moveToPicturesPanel('refresh', true); }, 300); } // Sorry for such a bad solution
				});
			}
			funcs_.addPicturesPanelButton = async (emojisGUI) =>
			{
				if(!emojisGUI) { return } // I know that in Discord there is no "s"
				// let emojiButton = document.querySelector('button[class*="emojiButton"]'); // Emojis button in chat
				let emojisMenu = emojisGUI.querySelector('div[aria-label*="Expression Picker"]'); // Panel menus
				if(!emojisMenu) { return }
				// Previous button click fix: START
				let previousButton = emojisMenu.querySelector('div[aria-selected*="true"]');
				let previousButtonID = previousButton ? previousButton.id : null;
				if(previousButtonID)
				{
					function previousButtonFix(event)
					{
						let buttonCPFSP = document.getElementById(elementNames.CPFSP_buttonID);
						let from = buttonCPFSP.getAttribute('from');
						let emojiTabID = 'emoji-picker-tab';
						let gifTabID = 'gif-picker-tab';
						let fix = (from == emojiTabID) ? gifTabID : emojiTabID;
						// Select other button and after this select previous button again
						document.getElementById(fix).querySelector('button').click();
						document.getElementById(from).querySelector('button').click();
						buttonCPFSP.classList.remove(elementNames.CPFSP_activeButton);
						// DEBUG // console.log('Fixed', event);
					}
					previousButton.addEventListener("click", previousButtonFix, { once: true } );
				}
				// Previous button click fix: END
				if(document.getElementById(elementNames.CPFSP_buttonID)) { return }
				let buttonCPFSP = document.createElement('button');
				buttonCPFSP.innerText = 'Pictures';
				buttonCPFSP.setAttribute('id', elementNames.CPFSP_buttonID);
				buttonCPFSP.setAttribute('from', previousButtonID); // Necessary for fixing previous button
				let buttonClass = emojisMenu.querySelector('button').classList.value.replace('ButtonActive', 'Button'); // Copy class from other button in this menu
				buttonCPFSP.setAttribute('class', buttonClass);
				//buttonCPFSP.setAttribute('onclick', 'this.classList.add("TimeToPicturesPanel");');
				buttonCPFSP.removeEventListener('click', funcs_.moveToPicturesPanel); // Insurance
				buttonCPFSP.addEventListener('click', funcs_.moveToPicturesPanel);
				emojisMenu.append(buttonCPFSP);
			}
			funcs_.send2ChatBox = async (from) =>
			{
				if(!from) { return }
				let link = from.target.getAttribute('src'); // Only for events from clicking at imgs
				let path = from.target.getAttribute('path');
				let name = from.target.getAttribute('alt');
				let channelID = DiscordAPI.currentChannel.id; // or if from other library: BDFDB.ChannelUtils.getSelected().id
				let ChatBox = document.querySelector('div[class*="channelTextArea-"]').querySelector('div[role*="textbox"]'); // User's textbox
				let ChatBoxText = ChatBox ? Array.from(ChatBox.querySelectorAll('span')).pop() : null;
				if(!ChatBoxText) { return } // Stop method if user doesn't have access to chat
				if(Configuration.SendTextWithFile.Value)
				{ // Send text from textbox before send file
					if(ChatBoxText.innerText.length < 2002)
					{
						DiscordAPI.currentChannel.sendMessage(ChatBoxText.innerText);
					} // 2001 is limit for text length
					else  { BdApi.showConfirmationModal(`For you:`, `Baka, your text wasn't sent with message because your text is over 2000 symbols!`); return }
				}
				if(link.indexOf(';base64,') != -1)
				{
					path = decodeURI(path.replace('file:///', '')); // I know this stupid, but file:/// I need for features, maybe :/
					uploadModule.upload(channelID, new File([fs_.readFileSync(path)], name));
					return
				}
				/* // DEPRECATED (c)0.0.1 version //
				link = (escape(ChatBoxText.innerText) == "%uFEFF%0A") ? link : `\n${link}`; // "%uFEFF%0A" is empty chat value for Discord
				if(Configuration.PostLinksImmediately.Value) { } // Not ready yet
				BDFDB.LibraryModules.DispatchUtils.ComponentDispatch.dispatchToLastSubscribed(BDFDB.DiscordConstants.ComponentActions.INSERT_TEXT, {
					content: `${link}`
				}); // Adds text to user's textbox
				*/
				DiscordAPI.currentChannel.sendMessage(link);
			}
			funcs_.DiscordMenuObserver = new MutationObserver((mutations) =>
			{
				mutations.forEach((mutation) =>
				{
					if(!mutation.target.parentNode) { return }
					if(mutation.target.parentNode.getAttribute('role') != 'tabpanel') { return } // Find "emoji-picker-tab-panel" and "gif-picker-tab-panel"
					funcs_.addPicturesPanelButton(mutation.target.parentNode.parentNode);
				});
			})

			return class CustomPanelForSendingPictures extends Plugin
			{
				constructor() { super(); }
	//-----------| Load Info |-----------//
				getName() { return config.info.name; }
				getAuthor() { return config.info.author.name; }
				getVersion() { return config.info.version; }
				getDescription() { return config.info.description; }

	//-----------| Default Methods |-----------//
				async onStart()
				{
					try
					{
						if(!funcs_) { return console.warn('There is error with functions declaration'); }
						funcs_.loadConfiguration();
						funcs_.loadSettings(); // despite the fact that the same method is called in the directory scan - the plugin has an option to turn off automatic scan, so doesn't remove this
						funcs_.setStyles();
						console.log(config.info.name, 'loaded');

						funcs_.scanDirectory();
						funcs_.DiscordMenuObserver.observe(document.body, { childList: true, subtree: true });
					} catch(err) { console.warn('There is error with starting plugin:', err); }
				}

				onStop()
				{
					try
					{
						funcs_.DiscordMenuObserver.disconnect();
						funcs_.setStyles('delete');
						funcs_ = null;
						console.log(config.info.name, 'stopped');
						Patcher.unpatchAll();
					} catch(err) { console.warn('There is error with stoping plugin:', err); }
				}

				getSettingsPanel()
				{
					const Panel = document.createElement('div');
					Panel.setAttribute('class', 'form');
					Panel.setAttribute('style', 'width:100%;');
					new Settings.SettingGroup(`${this.getName()} ${config.info.version} Settings Menu`, { shown:true }).appendTo(Panel)
						.append(new Settings.Textbox('There is your folder for pictures:', `At the current update the folder can't be changing`, `${picturesPath}`, text =>
						{
							// DEBUG // console.log(text);
						}))
						.append(new Settings.Switch(Configuration.UseSentLinks.Title, Configuration.UseSentLinks.Description, Configuration.UseSentLinks.Value, checked =>
						{
							Configuration.UseSentLinks.Value = checked;
							funcs_.saveConfiguration();
						}))
						.append(new Settings.Switch(Configuration.SendTextWithFile.Title, Configuration.SendTextWithFile.Description, Configuration.SendTextWithFile.Value, checked =>
						{
							Configuration.SendTextWithFile.Value = checked;
							funcs_.saveConfiguration();
						}))
						.append(new Settings.Switch(Configuration.OnlyForcedUpdate.Title, Configuration.OnlyForcedUpdate.Description, Configuration.OnlyForcedUpdate.Value, checked =>
							{
								Configuration.OnlyForcedUpdate.Value = checked;
								funcs_.saveConfiguration();
						}))
						.append(new Settings.Switch(Configuration.sentType2srcType.Title, Configuration.OnlyForcedUpdate.Description, Configuration.sentType2srcType.Value, checked =>
						{
							Configuration.sentType2srcType.Value = checked;
							funcs_.saveConfiguration();
						}))
						.append(new Settings.ColorPicker(Configuration.SectionTextColor.Title, Configuration.SectionTextColor.Description, Configuration.SectionTextColor.Value, color =>
							{
								Configuration.SectionTextColor.Value = color;
								funcs_.saveConfiguration();
								funcs_.setStyles('delete');
								funcs_.setStyles();
						}));
					return Panel;
				}

			};

		}; return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
