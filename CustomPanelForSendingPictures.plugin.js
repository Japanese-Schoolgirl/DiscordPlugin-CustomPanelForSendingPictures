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
			version: "0.0.4",
			description: "Adds panel which load pictures by links from settings and allow you to repost pictures via clicking to their preview.",
			github: "https://github.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures",
			github_raw: "https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/CustomPanelForSendingPictures.plugin.js"
		},
		changelog:
		[
			{
				title: "Fixed styles behaviour",
				type: "fixed",
				items: ["Add scroller and fixes resize bugs."]
			}
		]
	};
/*========================| Modules |========================*/
	const fs_ = window.require('fs');
	const path_ = window.require('path');
	const uploadModule = window.BdApi.findModule(m => m.upload && typeof m.upload === 'function'); // Module from BdApi for uploading files, can be replaced

/*========================| Core |========================*/
	//-----------| Check at ZeresPlugin Library |-----------//
	return !global.ZeresPluginLibrary ? class
	{
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
						await new Promise(r => fs_.writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
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
	padding-right: 0px;
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
	margin: 15px 0px 0px 15px;
	*/
}
.CPFSP_li {
	display: inline-block;
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
			`
			var elementNames = {
				id: 				'CPFSP_StyleSheet',
				CPFSP_panelID: 		'CPFSP_Panel',
				CPFSP_buttonID: 	'CPFSP_Button',
				elementList: 		'CPFSP_List',
				folderSection:		'CPFSP_Section',
				elementRow: 		'CPFSP_ul',
				elementCol: 		'CPFSP_li',
				newPicture: 		'CPFSP_IMG',
				buttonRefresh: 		'CPFSP_btnRefresh'
				
			}
	//-----------|  End of Styles section |-----------//

	//-----------|  Functions |-----------//
			function setStyles(command = null)
			{
				if(document.getElementById(elementNames.id) && command == 'delete') { return document.getElementById(elementNames.id).remove(); }
				if(document.getElementById(elementNames.id)) { return }
				let pluginStyles = document.createElement('style');
				pluginStyles.setAttribute('id', elementNames.id);
				pluginStyles.innerHTML = CPFSP_Styles;
				return document.body.append(pluginStyles);
			}
			function saveSettings(data)
			{
				if(!Object.keys(data).length) { return loadDefaultSettings(); } // This happen when folder is empty
				fs_.writeFile(settingsPath, JSON.stringify(data), function(err)
				{
					if(err)
					{
						return console.warn('There has been an error saving your settings data:', err.message);
					}
				});
				scaningReady = true;
				// console.log('Path: ', __dirname);
			}
			function loadSettings()
			{
				let newPicsSettings = [];
				if(!fs_.existsSync(settingsPath)) { loadDefaultSettings(); return picsSettings; } // This happen when settings file doesn't exist
				try { newPicsSettings = JSON.parse(fs_.readFileSync(settingsPath)); }
				catch(err) { console.warn('There has been an error parsing your settings JSON:', err.message); return picsSettings; }
				if(!Object.keys(newPicsSettings).length) { loadDefaultSettings(); return picsSettings; }  // This happen when settings file is empty
				picsSettings = newPicsSettings;
				return picsSettings;
			}
			function loadDefaultSettings()
			{
				picsSettings = [ { name: 'Placeholder', link: 'https://loremipsum.png' } ]; // Placeholder
				saveSettings(picsSettings);
				scaningReady = true;
			}
			function loadConfiguration()
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
			function saveConfiguration()
			{
				let exportData = JSON.stringify(Configuration);
				fs_.writeFile(configPath, exportData, function(err)
				{
					if(err)
					{
						return console.warn('There has been an error saving your config data:', err.message);
					}
				});
				loadConfiguration();
			}
			function scanFolderPictures(forced = null)
			{
				if(Configuration.OnlyForcedUpdate.Value && !forced) { scaningReady = true; return true }
				if(fs_.existsSync(picturesPath))
				{ // Exist
					fs_.readdir(picturesPath, function(err, files)
					{
						if(err) { return console.warn('Unable to scan directory:' + err); }
						let newPicsSettings = [];
						let alreadySendedFiles = [];
						let index = 0;
						files.forEach((file) =>
						{
							let fileTypesAllow = ['.jpg', '.jpeg', '.bmp', '.png', '.gif', srcType, sentType];
							let fileType = path_.extname(file);
							let filePath = picturesPath + file;
							let webLink;
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
								alreadySendedFiles.push({ name: file, link: webLink });
								return;
							}

							if(fileType == srcType) { newPicsSettings[index] = { name: file, link: webLink }; }
							else { newPicsSettings[index] = { name: file, link: 'file:///' + filePath }; }
							index++; // Index will increase ONLY if file is allowed
						});
						// DEBUG // console.log(newPicsSettings);
						// DEBUG // console.log(alreadySendedFiles);
						alreadySendedFiles.forEach((file) =>
						{ // Replace all local links with web links
							let finded = newPicsSettings.find(el => el.name == file.name.slice(0, -sentType.length));
							if(finded) { finded.link = file.link; }
						});
						// DEBUG // console.log(newPicsSettings);
						saveSettings(newPicsSettings); // Apply new settings
					});
				}
				else
				{ // Not Exist
					try { fs_.mkdirSync(picturesPath); } // Create folder
					catch (err) { console.warn(err.code); }
				}
				return true
			}
			async function moveToPicturesPanel(elem = null)
			{
				let command = elem ? elem.target.getAttribute('command') : null;
				let buttonCPFSP = document.getElementById(elementNames.CPFSP_buttonID);
				if(!buttonCPFSP) { return }
				let emojisGUI = buttonCPFSP.parentNode.parentNode.parentNode; // Up to "contentWrapper-"
				let emojisPanel = emojisGUI.querySelector('div[role*="tabpanel"]'); // Emojis panel
				if(!emojisPanel) { return }
				scaningReady = false; // Spaghetti fix long loading files
				scanFolderPictures(command);
				(function waitingScan()
				{
					if(!scaningReady) { return setTimeout(()=> { waitingScan(); }, 10); }
					if(document.getElementById(elementNames.CPFSP_panelID) && command != 'refresh') { return } // Will repeat if command == refresh
					emojisPanel.innerHTML = ''; // Clear panel
					emojisPanel.setAttribute('id', elementNames.CPFSP_panelID); // Change panel ID

					let elementList = document.createElement('div');
					let folderSection = document.createElement('div');
					elementList.setAttribute('class', elementNames.elementList);
					folderSection.setAttribute('class', elementNames.folderSection);
					folderSection.append(document.createElement('text').innerText = 'Main folder'); // Set name to section
					let elementRow = document.createElement('ul');
					let rowIndex = 1;
					let colIndex = 1;
					loadSettings().forEach((file)=>
					{
						/* // DEPRECATED //
						if(colIndex > 13)
						{ // is count of Discord emojis in UI
							rowIndex++;
							colIndex = 1;
							folderSection.append(elementRow); // Add emojis to special section
							elementRow = document.createElement('ul');
						}
						*/
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
						newPicture.addEventListener('click', send2ChatBox);
						elementCol.append(newPicture); // Add IMG to "li"
						elementRow.append(elementCol); // Add "li" to "ul"
						colIndex++;
					});
					folderSection.append(elementRow); // Add emojis to special section
					elementList.append(folderSection); // Add all sections to list
					emojisPanel.append(elementList); // Add list to panel 

					let buttonRefresh = document.createElement('div'); // Refresh button
					buttonRefresh.setAttribute('class', elementNames.buttonRefresh);
					buttonRefresh.setAttribute('command', 'refresh');
					buttonRefresh.innerText = 'Refresh';
					buttonRefresh.addEventListener('click', moveToPicturesPanel);
					emojisPanel.insertBefore(buttonRefresh, emojisPanel.firstChild); // Add button to panel
				})();
			}
			async function addPicturesPanelButton(emojisGUI)
			{
				if(!emojisGUI) { return }
				// let emojiButton = document.querySelector('button[class*="emojiButton"]'); // Emojis button in chat
				let emojisMenu = emojisGUI.querySelector('div[aria-label*="Expression Picker"]'); // Panel menus
				if(!emojisMenu) { return }
				if(document.getElementById(elementNames.CPFSP_buttonID)) { return }
				let buttonCPFSP = document.createElement('button');
				buttonCPFSP.innerText = 'Pictures';
				buttonCPFSP.setAttribute('id', elementNames.CPFSP_buttonID);
				let buttonClass = emojisMenu.querySelector('button').classList.value.replace('ButtonActive', 'Button'); // Copy class from other button in this menu
				buttonCPFSP.setAttribute('class', buttonClass);
				buttonCPFSP.removeEventListener('click', moveToPicturesPanel); // Insurance
				buttonCPFSP.addEventListener('click', moveToPicturesPanel);
				emojisMenu.append(buttonCPFSP);
			}
			async function send2ChatBox(from)
			{
				if(!from) { return }
				let link = from.target.getAttribute('src'); // Only for events from clicking at imgs
				let path = from.target.getAttribute('path');
				let name = from.target.getAttribute('alt');
				let channelID = ZLibrary.DiscordAPI.currentChannel.id; // or if from other library: BDFDB.ChannelUtils.getSelected().id
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
				}); // Add text to user's textbox
				*/
				ZLibrary.DiscordAPI.currentChannel.sendMessage(link);
			}
			var DiscordMenuObserver = new MutationObserver((mutations) =>
			{
				mutations.forEach((mutation) =>
				{
					if(!mutation.target.parentNode) { return }
					if(mutation.target.parentNode.getAttribute('role') != 'tabpanel') { return } // Find "emoji-picker-tab-panel" and "gif-picker-tab-panel"
					addPicturesPanelButton(mutation.target.parentNode.parentNode);
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

	//-----------| Method |-----------//
				async onStart()
				{
					loadConfiguration();
					loadSettings();
					setStyles();
					console.log(config.info.name, 'loaded');

					scanFolderPictures();
					DiscordMenuObserver.observe(document.body, { childList: true, subtree: true });
				}

				onStop()
				{
					setStyles('delete');
					DiscordMenuObserver.disconnect();
					console.log(config.info.name, 'stopped');
					Patcher.unpatchAll();
				}

				getSettingsPanel()
				{
					const Panel = document.createElement('div');
					Panel.setAttribute('class', 'form');
					Panel.setAttribute('style', 'width:100%;');
					new Settings.SettingGroup(this.getName()+' Settings Menu', { shown:true }).appendTo(Panel)
						.append(new Settings.Textbox('There is your folder for pictures:', `At the current update the folder can't be changing`, `${picturesPath}`, text =>
						{
							//console.log(text);
						}))
						.append(new Settings.Switch(Configuration.UseSentLinks.Title, Configuration.UseSentLinks.Description, Configuration.UseSentLinks.Value, checked =>
						{
							Configuration.UseSentLinks.Value = checked;
							saveConfiguration();
						}))
						.append(new Settings.Switch(Configuration.OnlyForcedUpdate.Title, Configuration.OnlyForcedUpdate.Description, Configuration.OnlyForcedUpdate.Value, checked =>
						{
							Configuration.OnlyForcedUpdate.Value = checked;
							saveConfiguration();
						}))
						.append(new Settings.Switch(Configuration.sentType2srcType.Title, Configuration.OnlyForcedUpdate.Description, Configuration.sentType2srcType.Value, checked =>
						{
							Configuration.sentType2srcType.Value = checked;
							saveConfiguration();
						}));
					return Panel;
				}

			};

		}; return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
