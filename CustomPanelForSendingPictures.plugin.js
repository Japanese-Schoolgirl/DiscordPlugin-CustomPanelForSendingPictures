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
			version: "0.1.8",
			description: "Adds panel that loads pictures via settings file with used files and links, allowing you to send pictures in chat with or without text by clicking on pictures preview on the panel. Settings file is automatically created on scanning the plugin folder or custom folder (supports subfolders and will show them as sections/groups).",
			github: "https://github.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures",
			github_raw: "https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/CustomPanelForSendingPictures.plugin.js"
		},
		changelog:
		[
			{
				title: `Replaced janky fix with better fix`,
				type: "fixed",
				items: [`Removed unnecessary pieces of code, and scan function is working better now than before.`]
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
			var lastSent = {};
			let sendingCooldown = {time: 0, duration: 0};
			let sentType = '.sent';
			let srcType = '.src';
			let mainFolderName = 'Main folder!/\\?'; // It'll still be used for arrays and objects. Change in configuration only affects at section's name
			let folderListName = `?/\\!FolderList!/\\?`;
			var Configuration = { // Almost all Default values need only as placeholder
				UseSentLinks:			{ Value: true, 					Default: true, 						Title: `Use "Sent Links"`, 								Description: `To create and use ${sentType} files that are replacing file sending by sending links.` },
				SendTextWithFile:		{ Value: false, 				Default: false, 					Title: `Send text from textbox before sending file`, 	Description: `To send text from textbox before sending local or web file. Doesn't delete text from textbox. Doesn't send message over 2000 symbols limit.` },
				OnlyForcedUpdate:		{ Value: true, 					Default: true, 						Title: `Only forced update`, 							Description: `Doesn't allow plugin to automatically update settings via scan with used files without user interaction.` },
				sentType2srcType:		{ Value: false, 				Default: false, 					Title: `Treat ${sentType} as ${srcType}`, 				Description: `To use ${sentType} as ${srcType}.` },
				RepeatLastSent:			{ Value: false, 				Default: false, 					Title: `Repeat last sent`, 								Description: `To use Alt+V hotkey for repeat sending your last sent file or link (without text) to current channel.` },
				AutoClosePanel:			{ Value: false, 				Default: false, 					Title: `Auto close panel`, 								Description: `To autoclose pictures panel after sending any file when pressed without Shift modificator key.` },
				SendingFileCooldown:	{ Value: 0, 					Default: '0', 						Title: `Sending file cooldown`, 						Description: `To set cooldown in millisecond before you can send another file. Set 0 in this setting to turn this off. This option exists to prevent double/miss clicks so it doesn't apply to hotkey sending.` },
				SetFileSize:			{ Value: '', 					Default: '?width=45&height=45', 	Title: `Set web file size (off by default)`, 			Description: `To automatically add custom width and height and others parameters for sending links. Remove value in this setting to turn this off.` },
				mainFolderPath:			{ Value: picturesPath, 			Default: picturesPath, 				Title: `There is your folder for pictures:`, 			Description: `You can set your Main folder which will be scanned for pictures and subfolders. Please try to avoid using folders of very big size (50+ mb). Chosen directory should already exist.` },
				mainFolderNameDisplay:	{ Value: 'Main folder', 		Default: 'Main folder', 			Title: `Displayed section name for Main folder`, 		Description: `You can set this section name to Main folder:` },
				SectionTextColor:		{ Value: 'color: #000000bb', 	Default: 'color: #000000bb', 		Title: `Section's name color`, 							Description: `Your current color is:` }
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
				buttonRefresh: 			'CPFSP_btnRefresh',
				emojiTabID:				'emoji-picker-tab',
				gifTabID: 				'gif-picker-tab'
			}
			var labelsNames = {
				Pictures: 			'Pictures',
				configMenu: 		'Configuration Menu'
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
			funcs_.setLanguage = () =>
			{ // Janky localization
				switch(ZLibrary.DiscordAPI.UserSettings.locale)
				{
					case 'ru':
						config.info.description = 'Добавляет панель, которая подгружает картинки через файл настроек с используемыми файлами и ссылками, позволяя отправлять картинки с текстом или без текста нажатием по превью картинок на панели. Файл настроек автоматически создаётся при сканировании выбранной папки или папки плагина (поддерживает подпапки и будет отображать их как секции/группы).'; // Only config constanta, not keys inside
						labelsNames.Pictures = `Картинки`;
						labelsNames.configMenu = `Меню Конфигурации`;
						Configuration.UseSentLinks.Title = `Использовать "Отправленные Ссылки"`;
						Configuration.UseSentLinks.Description = `Включает создание и использование ${sentType} файлов, которые заменяют отправку файлов отправкой ссылок.`;
						Configuration.SendTextWithFile.Title = `Отправлять текст из чата перед отправкой файла`;
						Configuration.SendTextWithFile.Description = `Включает отправку текста из чата перед отправкой локального или веб файла. Не удаляет текст из чата. Не отправляет сообщения превышающие 2000 символов.`;
						Configuration.OnlyForcedUpdate.Title = `Только принудительное обновление`;
						Configuration.OnlyForcedUpdate.Description = `Не позволяет плагину автоматически обновлять настройки через сканирование с используемыми файлами без участия пользователя.`;
						Configuration.sentType2srcType.Title = `Рассматривать ${sentType} как ${srcType}`;
						Configuration.sentType2srcType.Description = `Для использования ${sentType} в качестве ${srcType}.`;
						Configuration.RepeatLastSent.Title = `Повторение последний отправки`;
						Configuration.RepeatLastSent.Description = `Включает использование сочетания клавиш Alt+V для повторения отправки последнего отправленного файла или ссылки (без текста) в текущий канал.`;
						Configuration.AutoClosePanel.Title = `Автоматическое закрытие панели`;
						Configuration.AutoClosePanel.Description = `Для автоматического закрытия панели с картинками после отправки любого файла по нажатию, если не зажата клавиша Shift.`;
						Configuration.SendingFileCooldown.Title = `Минимальная задержка перед отправкой`;
						Configuration.SendingFileCooldown.Description = `Присваивает минимальную задержку в миллисекундах перед отправкой следующего файла. При присвоении значения 0 опция будет отключена. Эта опция существует для предотвращения удвоенных/случайных нажатий мышкой и поэтому не применяется на отправку по быстрой клавише.`;
						Configuration.SetFileSize.Title = `Присваивать размер веб файлу (выключено по умолчанию)`;
						Configuration.SetFileSize.Description = `Включает автоматическое добавление выбранный ширины и высоты и других параметров для отправляемой ссылки. Удаление значения в этой настройке выключает её.`;
						Configuration.mainFolderPath.Title = `Здесь располагается папка под картинки:`;
						Configuration.mainFolderPath.Description = `Позволяет указать Главную папку, которая будет сканироваться на картинки и подпапки. Пожалуйста, постарайтесь избежать использования папок с большим размером (50+ мб). Выбранная директория должна быть созданной.`;
						Configuration.mainFolderNameDisplay.Title = `Отображаемое имя секции для Главной папки`;
						Configuration.mainFolderNameDisplay.Description = `Присваивает выбранное название для секции с Главной папкой:`;
						Configuration.SectionTextColor.Title = `Цвет имени секций`;
						Configuration.SectionTextColor.Description = `Текущий цвет это:`;
						break
					default: // is "en-US"
						break
				}
			}
			funcs_.saveSettings = (data, once = null) =>
			{
				if(Object.keys(data).length < 2) { return funcs_.loadDefaultSettings(); } // This happen when folder is empty
				try { fs_.writeFileSync(settingsPath, JSON.stringify(data)); }
				catch(err) { console.warn('There has been an error saving your setting data:', err.message); }
				if(once) { return picsGlobalSettings; } // to avoid endless engine
				return funcs_.loadSettings();
				// DEBUG // console.log('Path: ', __dirname);
			}
			funcs_.loadSettings = (anotherTry = null) =>
			{
				let newPicsGlobalSettings = {};
				if(!fs_.existsSync(settingsPath)) { return funcs_.loadDefaultSettings(); } // This happen when settings file doesn't exist
				try { newPicsGlobalSettings = JSON.parse(fs_.readFileSync(settingsPath)); }
				catch(err)
				{
					console.warn('There has been an error parsing your settings JSON:', err.message);
					if(!anotherTry) { return funcs_.loadSettings(true) }
					return picsGlobalSettings;
				}
				if(!Object.keys(newPicsGlobalSettings).length) { return funcs_.loadDefaultSettings(); }  // This happen when settings file is empty
				picsGlobalSettings = newPicsGlobalSettings;
				return picsGlobalSettings;
			}
			funcs_.loadDefaultSettings = () =>
			{
				picsGlobalSettings = {};
				picsSettings = [ { name: 'AnnoyingLisa', link: 'https://i.imgur.com/l5Jf0VP.png' }, { name: 'AngryLisaNoises', link: 'https://i.imgur.com/ntW5Vqt.png'} ]; // Placeholder
				picsGlobalSettings[folderListName] = [ { name: mainFolderName, path: Configuration.mainFolderPath.Value } ];
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
					if(newData[key] == undefined) { return }; // I hope that I will not forget that not to do !newData[key] here :0
					Configuration[key].Value = newData[key];
				});
				if(Configuration.RepeatLastSent.Value)
				{
					document.body.removeEventListener('keydown', funcs_.RepeatLastSentFunc);
					document.body.addEventListener('keydown', funcs_.RepeatLastSentFunc);
				}
				funcs_.setLanguage();
			}
			funcs_.saveConfiguration = () =>
			{
				let exportData = {};
				Object.keys(Configuration).forEach((key) =>
				{
					exportData[key] = Configuration[key].Value;
				});
				try { fs_.writeFileSync(configPath, JSON.stringify(exportData)); }
				catch(err) { console.warn('There has been an error saving your config data:', err.message); }
				funcs_.loadConfiguration();
			}
			funcs_.scanDirectory = (forced = null, repeat = null) =>
			{ // Scanning plugin folder
				if((Configuration.OnlyForcedUpdate.Value && !forced) && !repeat) { return funcs_.loadSettings(); }
				if(fs_.existsSync(Configuration.mainFolderPath.Value))
				{ // Exist
					funcs_.findPictures(Configuration.mainFolderPath.Value);
					return funcs_.loadSettings(); // funcs_.findPictures will store data in picsGlobalSettings, so with state it possible to decide when new data is received
				}
				else
				{ // Not Exist
					if(Configuration.mainFolderPath.Value.length < 2) { Configuration.mainFolderPath.Value = Configuration.mainFolderPath.Default; } // Protection against shoot on foots
					try { fs_.mkdirSync(Configuration.mainFolderPath.Value); } // Try create folder
					catch (err) { console.warn(err.code); }
					if(!repeat) { funcs_.scanDirectory(forced, true); } // Fixed issue with necessary double scan when user delete folder
					return picsGlobalSettings;
				}
			}
			funcs_.findPictures = (scanPath, newAllPicsSettings = {}, folderName = null, foldersForScan = [], emtpyFoldersList = []) =>
			{ // Scanning for pictures in select folder, "foldersForScan" store folders from plugin directory
				let newPicsSettings = [];
				let files;
				let isFirstScan = !folderName; // !(Object.keys(newAllPicsSettings).length);
				if(!scanPath) { return funcs_.loadSettings(); }
				if(!fs_.existsSync(scanPath)) { return funcs_.loadSettings(); }
				if(!folderName) { folderName = mainFolderName; }
				// function getDirs(scanPath) { return fs_.readdirSync(scanPath).filter(file => fs_.statSync(path_.join(scanPath, file)).isDirectory()); }
				try { files = fs_.readdirSync(scanPath); }
				catch(err) { console.warn('Unable to scan directory:' + err); return funcs_.loadSettings(); }
				let alreadySentFiles = [];
				if(isFirstScan) { foldersForScan.push({ name: mainFolderName, path: Configuration.mainFolderPath.Value }); } // Adds necessary information about main folder
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
				if(!Object.keys(files).length || !Object.keys(newPicsSettings).length)
				{ // Detect and adds emtpy folder to list for delete
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
							funcs_.findPictures(foldersForScan[folderIndex+1].path, newAllPicsSettings, foldersForScan[folderIndex+1].name, foldersForScan, emtpyFoldersList);
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

				return funcs_.saveSettings(newAllPicsSettings); // Apply new settings
			}
			funcs_.moveToPicturesPanel = (elem = null, once = null) =>
			{ // once for funcs_.scanDirectory and waitingScan check
				let command = (elem == 'refresh') ? 'refresh' : elem ? elem.target.getAttribute('command') : null;
				let buttonCPFSP = document.getElementById(elementNames.CPFSP_buttonID);
				if(!buttonCPFSP) { return }
				let emojisGUI = buttonCPFSP.parentNode.parentNode.parentNode; // Up to "contentWrapper-"
				let emojisPanel = emojisGUI.querySelector('div[role*="tabpanel"]'); // Emojis panel
				if(!emojisPanel) { return }
				let allPicsSettings;
				// Previous button click fix: START
				let emojisMenu = emojisGUI.querySelector('div[aria-label*="Expression Picker"]'); // Panel menus
				let previousButton = emojisMenu.querySelector('div[aria-selected*="true"]');
				let previousButtonID = previousButton ? previousButton.id : null;
				let additionalButton = (previousButtonID == elementNames.emojiTabID) ? document.getElementById(elementNames.gifTabID) : document.getElementById(elementNames.emojiTabID);
				if(previousButtonID)
				{
					buttonCPFSP.setAttribute('from', previousButtonID); // Necessary for fixing previous button
					function previousButtonFix(event)
					{
						let buttonCPFSP = document.getElementById(elementNames.CPFSP_buttonID);
						let from = buttonCPFSP.getAttribute('from');
						let fix = (from == elementNames.emojiTabID) ? elementNames.gifTabID : elementNames.emojiTabID;
						// Select other button and after this select previous button again
						document.getElementById(fix).querySelector('button').click();
						document.getElementById(from).querySelector('button').click();
						buttonCPFSP.classList.remove(elementNames.CPFSP_activeButton);
						// DEBUG // console.log('Fixed', event);
					}
					function additionalButtonFix(event)
					{
						document.getElementById(elementNames.CPFSP_buttonID).classList.remove(elementNames.CPFSP_activeButton);
					}
					try
					{ // Unselecting previous button
						previousButton.addEventListener("click", previousButtonFix, { once: true } );
						additionalButton.addEventListener("click", additionalButtonFix, { once: true } );
						previousButton.querySelector('button').classList.value = previousButton.querySelector('button').classList.value.replace('ButtonActive', 'Button');
						additionalButton.querySelector('button').classList.value = previousButton.querySelector('button').classList.value.replace('ButtonActive', 'Button');
					} catch(err) { console.warn(err); }
				}
				// Previous button click fix: END
				function creatingPanel()
				{
					allPicsSettings = funcs_.scanDirectory(command);
					if((document.getElementById(elementNames.CPFSP_panelID) && command != 'refresh')) { return } // Will repeat if command == refresh
					emojisPanel.innerHTML = ''; // Clear panel
					emojisPanel.setAttribute('id', elementNames.CPFSP_panelID); // Change panel ID
					buttonCPFSP.classList.add(elementNames.CPFSP_activeButton); // Add CSS for select
					let previousButton = document.getElementById(buttonCPFSP.getAttribute('from'));
					/*try
					{ // Unselecting previous button
						previousButton.querySelector('button').classList.value = previousButton.querySelector('button').classList.value.replace('ButtonActive', 'Button');
					} catch(err) { console.warn(err); }*/

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
						if(currentSection === mainFolderName) { currentSection = Configuration.mainFolderNameDisplay.Value; }
						folderSection.append(document.createElement('text').innerText = currentSection);
					}
					// DEBUG // console.log(allPicsSettings);
					allPicsSettings[folderListName].forEach((folder, indexFolder) =>
					{
						allPicsSettings[folder.name].forEach((file, indexFile)=>
						{
							if(indexFolder === 0 && indexFile === 0) { setCurrentSection(folder); } // Set first section for first element
							if(currentSection != folder.name && folder.name != mainFolderName)
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
							newPicture.setAttribute('title', file.name); // For displaying pictures name
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
				creatingPanel();
			}
			funcs_.addPicturesPanelButton = (emojisGUI) =>
			{
				if(!emojisGUI) { return } // I know that in Discord there is no "s"
				// let emojiButton = document.querySelector('button[class*="emojiButton"]'); // Emojis button in chat
				let emojisMenu = emojisGUI.querySelector('div[aria-label*="Expression Picker"]'); // Panel menus
				if(!emojisMenu) { return }
				if(document.getElementById(elementNames.CPFSP_buttonID)) { return }
				let buttonCPFSP = document.createElement('button');
				buttonCPFSP.innerText = labelsNames.Pictures;
				buttonCPFSP.setAttribute('id', elementNames.CPFSP_buttonID);
				let buttonClass = emojisMenu.querySelector('button').classList.value.replace('ButtonActive', 'Button'); // Copy class from other button in this menu
				buttonCPFSP.setAttribute('class', buttonClass);
				//buttonCPFSP.setAttribute('onclick', 'this.classList.add("TimeToPicturesPanel");');
				buttonCPFSP.removeEventListener('click', funcs_.moveToPicturesPanel); // Insurance
				buttonCPFSP.addEventListener('click', funcs_.moveToPicturesPanel);
				emojisMenu.append(buttonCPFSP);
			}
			funcs_.send2ChatBox = (from) => // from is event
			{
				if(!from) { return }
				if(!!Configuration.SendingFileCooldown.Value && !isNaN(Configuration.SendingFileCooldown.Value))
				{ // Cooldown
					if(!sendingCooldown.time)
					{
						sendingCooldown.time = Configuration.SendingFileCooldown.Value;
						sendingCooldown.duration = (setTimeout(()=> { sendingCooldown.time = 0 }, Configuration.SendingFileCooldown.Value));
					}
					else if(sendingCooldown.time != Configuration.SendingFileCooldown.Value)
					{
						clearTimeout(sendingCooldown.duration);
						sendingCooldown.time = Configuration.SendingFileCooldown.Value;
						sendingCooldown.duration = (setTimeout(()=> { sendingCooldown.time = 0 }, Configuration.SendingFileCooldown.Value));
					}
					else { console.log(config.info.name, 'message: default cooldown time is', sendingCooldown.time); return }
				} else if(sendingCooldown.time) { sendingCooldown.time = 0; }

				let link = Configuration.SetFileSize.Value.length ? from.target.getAttribute('src')+Configuration.SetFileSize.Value: from.target.getAttribute('src'); // Only for events from clicking at imgs
				let path = from.target.getAttribute('path');
				let name = from.target.getAttribute('alt');
				let channelID = DiscordAPI.currentChannel.id; // or if from other library: BDFDB.ChannelUtils.getSelected().id
				let ChatBox = document.querySelector('div[class*="channelTextArea-"]').querySelector('div[role*="textbox"]'); // User's textbox
				//let ChatBoxText = ChatBox ? Array.from(ChatBox.querySelectorAll('span')).pop() : null;
				if(!ChatBox) { return } // Stop method if user doesn't have access to chat

				if(Configuration.AutoClosePanel.Value)
				{
					if(document.getElementById(elementNames.CPFSP_buttonID) && !from.shiftKey)
					{ // Below code will run if panel is displayed && click without shift key
						let clickEvent = ChatBox.ownerDocument.createEvent('MouseEvents');
						clickEvent.initMouseEvent("mousedown", true, true, ChatBox.ownerDocument.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null); // Thanks stackoverflow.com ;)
						ChatBox.dispatchEvent(clickEvent);
					}
				}

				// Sending
				if(Configuration.SendTextWithFile.Value)
				{ // Send text from textbox before send file
					if(ChatBox.innerText.length < 2002)
					{
						if(ChatBox.innerText.replace(/\s/g, '').length > 0) { DiscordAPI.currentChannel.sendMessage(ChatBox.innerText); } // For don't send empty message
					} // 2001 is limit for text length
					else { BdApi.showConfirmationModal(`For you:`, `Baka, your text wasn't sent with message because your text is over 2000 symbols!`); return }
					
				}
				if(link.indexOf(';base64,') != -1)
				{
					path = decodeURI(path.replace('file:///', '')); // I know this stupid, but file:/// I need for features, maybe :/
					uploadModule.upload(channelID, file = new File([fs_.readFileSync(path)], name));
					lastSent = { file: file, link: null };
					return
				}
				/* // DEPRECATED (c)0.0.1 version //
				link = (escape(ChatBox.innerText) == "%uFEFF%0A") ? link : `\n${link}`; // "%uFEFF%0A" is empty chat value for Discord
				if(Configuration.PostLinksImmediately.Value) { } // Not ready yet
				BDFDB.LibraryModules.DispatchUtils.ComponentDispatch.dispatchToLastSubscribed(BDFDB.DiscordConstants.ComponentActions.INSERT_TEXT, {
					content: `${link}`
				}); // Adds text to user's textbox
				*/
				lastSent = { file: null, link: link};
				return DiscordAPI.currentChannel.sendMessage(link);
			}
			funcs_.RepeatLastSentFunc = (event) =>
			{
				if(!Configuration.RepeatLastSent.Value) { return }
				if(!event.altKey || event.which != 86) { return } // 86 is V key, 18 is Alt
				if(!lastSent) { return }
				if(!lastSent.file && !lastSent.link) { return }
				if(lastSent.file)
				{
					let channelID = DiscordAPI.currentChannel.id;
					uploadModule.upload(channelID, lastSent.file);
				}
				else if(lastSent.link)
				{
					DiscordAPI.currentChannel.sendMessage(lastSent.link);
				}
			}
			funcs_.DiscordMenuObserver = new MutationObserver((mutations) =>
			{
				mutations.forEach((mutation) =>
				{
					if(!mutation.target.parentNode) { return }
					if(mutation.target.parentNode.getAttribute('role') != 'tabpanel') { return } // Find "emoji-picker-tab-panel" and "gif-picker-tab-panel"
					funcs_.addPicturesPanelButton(mutation.target.parentNode.parentNode); // contentWrapper
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
				onStart()
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
						document.body.removeEventListener('keydown', funcs_.RepeatLastSentFunc);
						funcs_ = null;
						console.log(config.info.name, 'stopped');
						Patcher.unpatchAll();
					} catch(err) { console.warn('There is error with stoping plugin:', err); }
				}

				getSettingsPanel()
				{
					const Panel = document.createElement('div');
					var PanelElements = {};
					Panel.setAttribute('class', 'form');
					Panel.setAttribute('style', 'width:100%;');
					new Settings.SettingGroup(`${this.getName()} (${this.getVersion()}) ${labelsNames.configMenu}`, { shown:true }).appendTo(Panel)
						// Use Sent Links
						.append(new Settings.Switch(Configuration.UseSentLinks.Title, Configuration.UseSentLinks.Description, Configuration.UseSentLinks.Value, checked =>
						{
							Configuration.UseSentLinks.Value = checked;
							funcs_.saveConfiguration();
						}))
						// Send Text With File
						.append(new Settings.Switch(Configuration.SendTextWithFile.Title, Configuration.SendTextWithFile.Description, Configuration.SendTextWithFile.Value, checked =>
						{
							Configuration.SendTextWithFile.Value = checked;
							funcs_.saveConfiguration();
						}))
						// Only Forced Update
						.append(new Settings.Switch(Configuration.OnlyForcedUpdate.Title, Configuration.OnlyForcedUpdate.Description, Configuration.OnlyForcedUpdate.Value, checked =>
						{
							Configuration.OnlyForcedUpdate.Value = checked;
							funcs_.saveConfiguration();
						}))
						// sentType to srcType
						.append(new Settings.Switch(Configuration.sentType2srcType.Title, Configuration.sentType2srcType.Description, Configuration.sentType2srcType.Value, checked =>
						{
							Configuration.sentType2srcType.Value = checked;
							funcs_.saveConfiguration();
						}))
						// Repeat Last Sent
						.append(new Settings.Switch(Configuration.RepeatLastSent.Title, Configuration.RepeatLastSent.Description, Configuration.RepeatLastSent.Value, checked =>
						{
							Configuration.RepeatLastSent.Value = checked;
							funcs_.saveConfiguration();
						}))
						// Auto Close Panel
						.append(new Settings.Switch(Configuration.AutoClosePanel.Title, Configuration.AutoClosePanel.Description, Configuration.AutoClosePanel.Value, checked =>
						{
							Configuration.AutoClosePanel.Value = checked;
							funcs_.saveConfiguration();
						}))
						// Sending File Cooldown
						.append(new Settings.Textbox(Configuration.SendingFileCooldown.Title, Configuration.SendingFileCooldown.Description, Configuration.SendingFileCooldown.Value, text =>
						{
							if(isNaN(text)) { return }
							Configuration.SendingFileCooldown.Value = text;
							funcs_.saveConfiguration();
						}, { placeholder: Configuration.SendingFileCooldown.Default }))
						// Set File Size
						.append(new Settings.Textbox(Configuration.SetFileSize.Title, Configuration.SetFileSize.Description, Configuration.SetFileSize.Value, text =>
						{
							Configuration.SetFileSize.Value = text;
							funcs_.saveConfiguration();
						}, { placeholder: Configuration.SetFileSize.Default }))
						// Main Folder Path
						.append(new Settings.Textbox(Configuration.mainFolderPath.Title, Configuration.mainFolderPath.Description, Configuration.mainFolderPath.Value, text =>
						{
							if(!text.length) { return }
							if(!fs_.existsSync(text)) { return Configuration.mainFolderPath.Value = Configuration.mainFolderPath.Default; }
							Configuration.mainFolderPath.Value = text;
							funcs_.saveConfiguration();
						}, { placeholder: Configuration.mainFolderPath.Default }))
						// Main Folder Name Display
						.append(new Settings.Textbox(Configuration.mainFolderNameDisplay.Title, Configuration.mainFolderNameDisplay.Description, Configuration.mainFolderNameDisplay.Value, text =>
						{
							if(!text.length) { return }
							Configuration.mainFolderNameDisplay.Value = text;
							funcs_.saveConfiguration();
						}, { placeholder: Configuration.mainFolderNameDisplay.Default }))
						// Section Text Color
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
