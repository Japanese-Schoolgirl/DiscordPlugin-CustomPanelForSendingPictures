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
			version: "0.0.8",
			description: "Adds panel which load pictures by links from settings and allow you to repost pictures via clicking to their preview. Links are automatically created on scanning the plugin folder (supports subfolders and will show them as section/groups).",
			github: "https://github.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures",
			github_raw: "https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/CustomPanelForSendingPictures.plugin.js"
		},
		changelog:
		[
			{
				title: "Fixed the buttons in emojis GUI",
				type: "fixed",
				items: ["Fixed display of selected button and bug with disappearing click on previous button."]
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
			var picsSettings = [];
			var pluginPath, settingsPath, configPath, picturesPath;
			pluginPath = __dirname.indexOf('\\electron.asar\\') != -1 ? __dirname.split('app-')[0] : __dirname + '\\';
			settingsPath = pluginPath + config.info.name + '.settings.json';
			configPath = pluginPath + config.info.name + '.config.json';
			picturesPath = pluginPath + config.info.name + '\\';
			let sentType = '.sent';
			let srcType = '.src';
			let mainFolderName = 'Main folder';
			let folderListName = `?/\\!FolderList!/\\?`;
			let scaningReady = true;
			var Configuration = {
				UseSentLinks:		{ Value: true, 	Title: `Use Sent Links`, 	Description: `To create and use .sent files that are replacing file sending by sending links.` },
				OnlyForcedUpdate:		{ Value: false, 	Title: `Only Forced Update`, 	Description: `Doesn't allow plugin to automatically update settings with used files without user interaction.` },
				sentType2srcType:		{ Value: false, 	Title: `Treat ${sentType} as ${srcType}`, 	Description: `To use ${sentType} as ${srcType}.` }
			};
	//-----------|  Start of Styles section |-----------//
			var CPFSP_Styles = ` /* Extract from "emojiList" and etc classes + additional margin and fixes */
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
			`
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
				pluginStyles.innerHTML = CPFSP_Styles;
				return document.body.append(pluginStyles);
			}
			funcs_.saveSettings = (data) =>
			{
				if(!Object.keys(data).length) { return funcs_.loadDefaultSettings(); } // This happen when folder is empty
				fs_.writeFile(settingsPath, JSON.stringify(data), function(err)
				{
					if(err)
					{
						return console.warn('There has been an error saving your settings data:', err.message);
					}
				});
				scaningReady = true;
				// DEBUG // console.log('Path: ', __dirname);
			}
			funcs_.loadSettings = () =>
			{
				let newPicsSettings = {};
				if(!fs_.existsSync(settingsPath)) { funcs_.loadDefaultSettings(); return picsSettings; } // This happen when settings file doesn't exist
				try { newPicsSettings = JSON.parse(fs_.readFileSync(settingsPath)); }
				catch(err) { console.warn('There has been an error parsing your settings JSON:', err.message); return picsSettings; }
				if(!Object.keys(newPicsSettings).length) { funcs_.loadDefaultSettings(); return picsSettings; }  // This happen when settings file is empty
				picsSettings = newPicsSettings;
				return picsSettings;
			}
			funcs_.loadDefaultSettings = () =>
			{
				allPicsSettings = {};
				picsSettings = [ { name: 'Placeholder', link: 'https://loremipsum.png' } ]; // Placeholder
				allPicsSettings[folderListName] = { name: mainFolderName, path: picturesPath };
				allPicsSettings[mainFolderName] = picsSettings;
				funcs_.saveSettings(allPicsSettings);
				scaningReady = true;
			}
			funcs_.loadConfiguration = () =>
			{
				let newData;
				if(!fs_.existsSync(configPath)) { return } // This happen when settings file doesn't exist
				try { newData = JSON.parse(fs_.readFileSync(configPath)); }
				catch(err) { console.warn('There has been an error parsing your config JSON:', err.message); return }
				if(!newData || !Object.keys(newData).length) { return }  // This happen when settings file is empty
				if(!newData.UseSentLinks || !newData.OnlyForcedUpdate || !newData.sentType2srcType) { return }
				Configuration.UseSentLinks.Value = newData.UseSentLinks.Value;
				Configuration.OnlyForcedUpdate.Value = newData.OnlyForcedUpdate.Value;
				Configuration.sentType2srcType.Value = newData.sentType2srcType.Value;
			}
			funcs_.saveConfiguration = () =>
			{
				let exportData = JSON.stringify(Configuration);
				fs_.writeFile(configPath, exportData, function(err)
				{
					if(err)
					{
						return console.warn('There has been an error saving your config data:', err.message);
					}
				});
				funcs_.loadConfiguration();
			}
			funcs_.scanDirectory = (forced = null) =>
			{ // Scanning plugin folder
				if(Configuration.OnlyForcedUpdate.Value && !forced) { scaningReady = true; return true }
				if(fs_.existsSync(picturesPath))
				{ // Exist
					funcs_.findPictures(picturesPath);
					return true
				}
				else
				{ // Not Exist
					try { fs_.mkdirSync(picturesPath); } // Create folder
					catch (err) { console.warn(err.code); }
					scaningReady = true;
					return true
				}
			}
			funcs_.findPictures = (scanPath, newAllPicsSettings = {}, folderName = null, foldersForScan = [], emtpyFoldersList = []) =>
			{ // Scanning for pictures in select folder, "foldersForScan" store folders from plugin directory
				let newPicsSettings = [];
				let isFirstScan = !folderName; // !(Object.keys(newAllPicsSettings).length);
				if(!scanPath) { return }
				if(!fs_.existsSync(scanPath)) { return }
				if(!folderName) { folderName = mainFolderName; }
				// function getDirs(scanPath) { return fs_.readdirSync(scanPath).filter(file => fs_.statSync(path_.join(scanPath, file)).isDirectory()); }
				fs_.readdir(scanPath, function(err, files)
				{
					if(err) { return console.warn('Unable to scan directory:' + err); }
					let alreadySentFiles = [];
					if(isFirstScan) { foldersForScan.push({ name: mainFolderName, path: picturesPath }); } // Adds necessary information about main folder
					if(isFirstScan) { newAllPicsSettings[folderListName] = foldersForScan; } // Unnecessary reordering fix?
					let currentFolder = isFirstScan ? mainFolderName : folderName; // Get name of current folder
					let index = 0;
					files.forEach((file) =>
					{
						let isFolder = fs_.statSync(path_.join(scanPath, file)).isDirectory();
						let fileTypesAllow = ['.jpg', '.jpeg', '.bmp', '.png', '.gif', srcType, sentType];
						let fileType = path_.extname(file);
						let filePath = scanPath + file;
						let webLink;
						if(isFolder && isFirstScan) { foldersForScan.push({name: file, path: (path_.join(scanPath, file) + '\\') }); } // isFirstScan there prevents scans subfolders in subfolders. However this code not organize for subsubsubsubfolders scan yet
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
							return;
						}

						if(fileType == srcType) { newPicsSettings[index] = { name: file, link: webLink }; }
						else { newPicsSettings[index] = { name: file, link: 'file:///' + filePath }; }
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
						//////console.log(currentFolder, Object.keys(foldersForScan).length-1)
						foldersForScan.some((folder, folderIndex) =>
						{
							if(currentFolder == folder.name && folderIndex < Object.keys(foldersForScan).length-1) // it is X < X, where X count of folders
							{
								funcs_.findPictures(foldersForScan[folderIndex+1].path, newAllPicsSettings, foldersForScan[folderIndex+1].name, foldersForScan, emtpyFoldersList);
								return (needSkip = true);
							}
						});
						if(needSkip) { return } // If funcs_.findPictures used inside itself then this method will end there
					}
					// DEBUG // console.log(folders, newAllPicsSettings, newPicsSettings, isFirstScan);
					emtpyFoldersList.forEach((emtpyFolder) =>
					{
						newAllPicsSettings[folderListName].splice(newAllPicsSettings[folderListName].findIndex((folder) => folder.name == emtpyFolder.name && folder.path == emtpyFolder.path), 1);
					});
					funcs_.saveSettings(newAllPicsSettings); // Apply new settings
				});
			}
			funcs_.moveToPicturesPanel = async (elem = null) =>
			{
				let command = elem ? elem.target.getAttribute('command') : null;
				let buttonCPFSP = document.getElementById(elementNames.CPFSP_buttonID);
				if(!buttonCPFSP) { return }
				let emojisGUI = buttonCPFSP.parentNode.parentNode.parentNode; // Up to "contentWrapper-"
				let emojisPanel = emojisGUI.querySelector('div[role*="tabpanel"]'); // Emojis panel
				if(!emojisPanel) { return }
				scaningReady = false; // Spaghetti fix long loading files
				funcs_.scanDirectory(command);
				(function waitingScan()
				{
					if(!scaningReady) { return setTimeout(()=> { waitingScan(); }, 10); }
					if(document.getElementById(elementNames.CPFSP_panelID) && command != 'refresh') { return } // Will repeat if command == refresh
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
					let allPicsSettings = funcs_.loadSettings();
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
							} catch(err) { console.warn('There is problem with links:', err) }
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
					buttonRefresh.addEventListener('click', funcs_.moveToPicturesPanel);
					emojisPanel.insertBefore(buttonRefresh, emojisPanel.firstChild); // Adds button to panel
				})();
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
						funcs_.loadSettings();
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
					new Settings.SettingGroup(this.getName()+' Settings Menu', { shown:true }).appendTo(Panel)
						.append(new Settings.Textbox('There is your folder for pictures:', `At the current update the folder can't be changing`, `${picturesPath}`, text =>
						{
							// DEBUG // console.log(text);
						}))
						.append(new Settings.Switch(Configuration.UseSentLinks.Title, Configuration.UseSentLinks.Description, Configuration.UseSentLinks.Value, checked =>
						{
							Configuration.UseSentLinks.Value = checked;
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
						}));
					return Panel;
				}

			};

		}; return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
