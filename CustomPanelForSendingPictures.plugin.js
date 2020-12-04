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
			version: "0.2.9",
			description: "Adds panel that loads pictures via settings file with used files and links, allowing you to send pictures in chat with or without text by clicking on pictures preview on the panel. Settings file is automatically created on scanning the plugin folder or custom folder (supports subfolders and will show them as sections/groups).",
			github: "https://github.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures",
			github_raw: "https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/CustomPanelForSendingPictures.plugin.js"
		},
		changelog:
		[
			{
				title: `Fixed for Powercord (with BDCompat)`,
				type: "fixed", // without type, fixed, improved, progress
				items: [`Now plugin should be compatible with BDCompat.`]
			}
		]
	};
/*========================| Modules |========================*/
	const _getModule = require;
	const request_ = _getModule("request");
	const https_ = _getModule('https');
	const fs_ = _getModule('fs');
	const path_ = _getModule('path');
	const util_ = _getModule('util');
	const child_process_ = _getModule('child_process');
	const PluginApi_ = window.EDApi ? window.EDApi : window.BdApi ? window.BdApi : window.alert('PLUGIN API NOT FOUND');
	const uploadModule = PluginApi_.findModule(m => m.upload && typeof m.upload === 'function'); // Found module from BdApi/EDApi for uploading files can be replaced with WebpackModules.getModule(m => m.upload && typeof m.upload === 'function') or others
	const ComponentDispatchModule = PluginApi_.findModule(m => m.ComponentDispatch && typeof m.ComponentDispatch === 'object').ComponentDispatch; // For insert text with .dispatchToLastSubscribe and etc.

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
			PluginApi_.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click "Download Now" to install it.`,
			{
				confirmText: "Download Now",
				cancelText: "Cancel",
				onConfirm: () =>
				{
					request_.get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (err, res, body) =>
					{
						if(err) return _getModule("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
						await new Promise(r => fs_.writeFile(path_.join(PluginApi_.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
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

			const { Patcher, DiscordAPI, Modals, DiscordModules, Settings, PluginUtilities } = Api;
	//-----------| Create Settings and Variables |-----------//
			const resizePluginName = 'gifsicle';
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
			let NotFoundIMG = 'https://i.imgur.com/r0OCBLX.png'; // old is 'https://i.imgur.com/jz767Z6.png', src as base64 also ok;
			let imgPreviewSize = {W: '48px', H: '48px'};
			let mainFolderName = 'Main folder!/\\?'; // It'll still be used for arrays and objects. Change in configuration only affects at section's name
			let folderListName = `?/\\!FolderList!/\\?`;
			var Configuration = { // Almost all Default values need only as placeholder
				UseSentLinks:			{ Value: true, 										Default: true, 						Title: `Use "Sent Links"`, 								Description: `To create and use ${sentType} files that are replacing file sending by sending links.` },
				SendTextWithFile:		{ Value: false, 									Default: false, 					Title: `Send text from textbox before sending file`, 	Description: `To send text from textbox before sending local or web file. Doesn't delete text from textbox. Doesn't send message over 2000 symbols limit.` },
				OnlyForcedUpdate:		{ Value: true, 										Default: true, 						Title: `Only forced update`, 							Description: `Doesn't allow plugin to automatically update settings via scan with used files without user interaction.` },
				sentType2srcType:		{ Value: false, 									Default: false, 					Title: `Treat ${sentType} as ${srcType}`, 				Description: `To use ${sentType} as ${srcType}.` },
				RepeatLastSent:			{ Value: false, 									Default: false, 					Title: `Repeat last sent`, 								Description: `To use Alt+V hotkey for repeat sending your last sent file or link (without text) to current channel.` },
				AutoClosePanel:			{ Value: false, 									Default: false, 					Title: `Auto close panel`, 								Description: `To autoclose pictures panel after sending any file when pressed without Shift modificator key.` },
				SendingFileCooldown:	{ Value: 0, 										Default: '0', 						Title: `Sending file cooldown`, 						Description: `To set cooldown in millisecond before you can send another file. Set 0 in this setting to turn this off. This option exists to prevent double/miss clicks so it doesn't apply to hotkey sending.` },
				ScaleSizeForPictures:	{ Value: { type: 'width', num: '45', exp: false }, 	Default: '', 						Title: `Set size for scaling (on by default)`, 			Description: `For automatic proportional scaling of pictures from local or web files to set size. Value is set only either for width or height. Clicking while holding Ctrl key will ignore enabling of this option. Remove value in this setting to turn this off.` },
				SetLinkParameters:		{ Value: '', 										Default: '?width=45&height=45', 	Title: `Set parameters for web file (off by default)`, 	Description: `To automatically add custom parameters for sending links. Remove value in this setting to turn this off.` },
				mainFolderPath:			{ Value: picturesPath, 								Default: picturesPath, 				Title: `There is your folder for pictures:`, 			Description: `You can set your Main folder which will be scanned for pictures and subfolders. Please try to avoid using folders with very big amount of files. Chosen directory should already exist.` },
				mainFolderNameDisplay:	{ Value: 'Main folder', 							Default: 'Main folder', 			Title: `Displayed section name for Main folder`, 		Description: `You can set this section name to Main folder:` },
				SectionTextColor:		{ Value: 'color: #000000bb', 						Default: 'color: #000000bb', 		Title: `Section's name color`, 							Description: `Your current color is:` }
			};
	//-----------|  Start of Styles section |-----------//
			var CPFSP_Styles = () => { return ` /* Extract from "emojiList" and etc classes + additional margin and fixes */
#CPFSP_Panel {
	overflow: hidden;
	position: relative;
	background-color: transparent;
}
.CPFSP_List {
	top: ${5+22+27}px; /* 5 + height from search bar + height from buttons panel */
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
	width: ${imgPreviewSize.W};
	height: ${imgPreviewSize.H};
	cursor: pointer;
	background-size: 48px;
}
#CPFSP_btnsPanel {
	height: 27px; /* old is 30px */ 
	line-height: 27px; /* old is 32px */
	width: 100%;
	display: grid;
	grid-template-columns: auto 110px; /* or 75% 25%; */
	font-size: 15px;
	font-weight: 600;
	/* column-gap: 5px; */
}
.CPFSP_btnDefault {
	cursor: pointer;
	color: var(--channels-default);
	background-color: var(--background-tertiary);
	text-align: center;
	min-width: 48px;
	border-width: 1px 1px 1px 1px;
	border-style: solid;
	/*border-radius: 60px 60px 60px 60px;*/
}
.CPFSP_btnDefault:hover {
	color: var(--interactive-hover);
}
.CPFSP_btnDefault:active {
	color: var(--interactive-active);
}
#CPFSP_ButtonGo {
	/* ? */
}
.CPFSP_activeButton {
	background-color: var(--background-accent);
	color: #fff;
}
.CPFSP_searchBar {
	display: grid;
	grid-template-columns: auto 150px;
	width: 100%;
	font-size: 16px;
}
#CPFSP_searchBarInput {
	height: 26px;
	line-height: 26px;
	box-sizing: border-box;
	color: var(--text-normal);
	padding: 0 8px;
	background-color: var(--background-tertiary);
	border-color: var(--channels-default);
	border: solid;
	border-width: 1px 1px 0px 1px;
	border-radius: 10px 10px 0px 0px;
	overflow: hidden;
	resize: none;
}
#CPFSP_searchBarOptions {
	text-align-last: center;
	border-radius: 80px 80px 80px 80px;
	background-color: var(--background-tertiary);
	color: var(--interactive-active);
}
#CPFSP_scaleType {
	cursor: pointer;
	color: var(--channels-default);
	font-weight: 600;
}
#CPFSP_scaleExp {
	color: var(--channels-default);
	font-weight: 600;
}
#CPFSP_scaleExp input {
	cursor: pointer;
	margin: 5px 0px 0px 0px;
}
			`};

			var CPFSP_imgFilter = (value, options) => { return ` /* Adds filter that sets display none to all imgs that match with it */
#CPFSP_Panel .CPFSP_List li.CPFSP_li:not([${options.lettercase}${options.match}="${value}"]) {
	display: none !important;
}
.CPFSP_Section text {
	display: none !important;
}
.CPFSP_ul {
	display: inline !important;
}
			`};

			var elementNames = {
				id: 					'CPFSP_StyleSheet',
				filter: 				'CPFSP_StyleFilter',
				CPFSP_panelID: 			'CPFSP_Panel',
				CPFSP_buttonGoID: 		'CPFSP_ButtonGo',
				CPFSP_activeButton: 	'CPFSP_activeButton',
				elementList: 			'CPFSP_List',
				folderSection:			'CPFSP_Section',
				elementRow: 			'CPFSP_ul',
				elementCol: 			'CPFSP_li',
				newPicture: 			'CPFSP_IMG',
				buttonsPanel: 			'CPFSP_btnsPanel',
				buttonDefault: 			'CPFSP_btnDefault',
				buttonRefresh: 			'CPFSP_btnRefresh',
				buttonOpenFolder: 		'CPFSP_btnOpenFolder',
				searchBar: 				'CPFSP_searchBar',
				searchBarInput: 		'CPFSP_searchBarInput',
				searchBarOptions: 		'CPFSP_searchBarOptions',
				emojiTabID:				'emoji-picker-tab',
				gifTabID: 				'gif-picker-tab',
				Config_scaleType: 		'CPFSP_scaleType',
				Config_scaleExp: 		'CPFSP_scaleExp',
			}

			var labelsNames = {
				Modal_OkDownload: 		'Download Now',
				Modal_Cancel: 			'Cancel',
				Modal_Missing: 			'Library Missing',
				Modal_MissingLibs: 		`The library plugin needed for turned on options in plugin ${config.info.name} is missing. Please click "Download Now" to install it.`,
				Yamete: 				'Yamete!',
				tooBig: 				"It's too big!",
				Pictures: 				'Pictures',
				btnRefresh: 			'Refresh',
				btnOpenFolder: 			'Open folder',
				searchPicture: 			'Search picture',
				filterAnyMatch: 		'Any match',
				filterStrictMatch: 		'Strict match',
				filterAnyLetterCase: 	'Case-insensitive',
				filterInAnyPlace: 		'In any place',
				configMenu: 			'Configuration Menu',
				width: 					'Width',
				height: 				'Height',
				intNumber: 				'Integer number',
				scaleExperimental: 		'Experimental support for animations (additional library will be installed)'
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
			funcs_.setStyleFilter = (event = null, command = null) =>
			{
				let text = document.getElementById(elementNames.searchBarInput) ? document.getElementById(elementNames.searchBarInput).value : null;
				if(!text) { command = 'delete'; }
				if(text) { if(!text.length) { command = 'delete'; } }
				if(document.getElementById(elementNames.filter) && command == 'delete') { return document.getElementById(elementNames.filter).remove(); }
				if(!event || command == 'delete') { return }

				let options = document.getElementById(elementNames.searchBarOptions) ? document.getElementById(elementNames.searchBarOptions).value : null;
				switch(options)
				{
					case 'AnyMatch': options = { lettercase: 'lowerPicName', match: '*' }; break;
					case 'StrictMatch': options = { lettercase: 'strictPicName', match: '^' }; break;
					case 'AnyLetterCase': options = { lettercase: 'lowerPicName', match: '^' }; break;
					case 'InAnyPlace': options = { lettercase: 'strictPicName', match: '*' }; break;
					default: options = { lettercase: 'lowerPicName', match: '*' };
				}
				text = options.lettercase == 'lowerPicName' ? text.toLowerCase() : text;

				if(document.getElementById(elementNames.filter)) { return document.getElementById(elementNames.filter).innerHTML = CPFSP_imgFilter(text, options); }
				let pluginStyleFilter = document.createElement('style');
				pluginStyleFilter.setAttribute('id', elementNames.filter);
				pluginStyleFilter.innerHTML = CPFSP_imgFilter(text, options);
				return document.body.append(pluginStyleFilter);
			}
			funcs_.setLanguage = () =>
			{ // Janky localization
				switch(DiscordAPI.UserSettings.locale)
				{
					case 'ru':
						config.info.description = 'Добавляет панель, которая подгружает картинки через файл настроек с используемыми файлами и ссылками, позволяя отправлять картинки с текстом или без текста нажатием по превью картинок на панели. Файл настроек автоматически создаётся при сканировании выбранной папки или папки плагина (поддерживает подпапки и будет отображать их как секции/группы).'; // Only config constanta, not keys inside
						labelsNames.Modal_OkDownload = 'Скачать сейчас',
						labelsNames.Modal_Cancel = 'Отмена',
						labelsNames.Modal_Missing = 'Отсутствует библиотека',
						labelsNames.Modal_MissingLibs = `Отсутствует библиотека, необходимая для работы включённых опций в плагине ${config.info.name}. Пожалуйста, нажмите "${labelsNames.Modal_OkDownload}" для её установки.`,
						labelsNames.Yamete = `Ямете!`;
						labelsNames.tooBig = `Это слишком велико!`;
						labelsNames.Pictures = `Картинки`;
						labelsNames.btnRefresh = `Обновить`;
						labelsNames.btnOpenFolder = `Открыть папку`;
						labelsNames.searchPicture = `Искать картинку`;
						labelsNames.filterAnyMatch = 'Любое совпадение';
						labelsNames.filterStrictMatch = 'Строгое совпадение';
						labelsNames.filterAnyLetterCase = 'Любой регистр';
						labelsNames.filterInAnyPlace = 'В любом месте';
						labelsNames.configMenu = `Меню Конфигурации`;
						labelsNames.width = `Ширина`;
						labelsNames.height = `Высота`;
						labelsNames.intNumber = `Целое число`;
						labelsNames.scaleExperimental = `Экспериментальная поддержка анимаций (установится дополнительная библиотека)`;
						Configuration.UseSentLinks.Title = `Использовать "Отправленные Ссылки"`;
						Configuration.UseSentLinks.Description = `Включает создание и использование ${sentType} файлов, которые заменяют отправку файлов отправкой ссылок.`;
						Configuration.SendTextWithFile.Title = `Отправлять текст из чата перед отправкой файла`;
						Configuration.SendTextWithFile.Description = `Включает отправку текста из чата перед отправкой локального или веб файла. Не удаляет текст из чата. Не отправляет сообщение превышающее 2000 символов.`;
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
						Configuration.ScaleSizeForPictures.Title = `Присвоить размер для масштабирования (включено по умолчанию)`;
						Configuration.ScaleSizeForPictures.Description = `Для автоматического пропорционального масштабирования размера картинок из локальных или веб файлов к заданному размеру. Значение указывается только для ширины или высоты. Клик с зажатой клавишей Ctrl игнорирует включение этой опции. Удаление значения в этой настройке выключает её.`;
						Configuration.SetLinkParameters.Title = `Присваивать параметры веб файлу (выключено по умолчанию)`;
						Configuration.SetLinkParameters.Description = `Включает автоматическое добавление параметров для отправляемой ссылки. Удаление значения в этой настройке выключает её.`;
						Configuration.mainFolderPath.Title = `Здесь располагается папка под картинки:`;
						Configuration.mainFolderPath.Description = `Позволяет указать Главную папку, которая будет сканироваться на картинки и подпапки. Пожалуйста, постарайтесь избежать использования папок с большим количеством файлов. Выбранная директория должна быть созданной.`;
						Configuration.mainFolderNameDisplay.Title = `Отображаемое имя секции для Главной папки`;
						Configuration.mainFolderNameDisplay.Description = `Присваивает выбранное название для секции с Главной папкой:`;
						Configuration.SectionTextColor.Title = `Цвет имени секций`;
						Configuration.SectionTextColor.Description = `Текущий цвет это:`;
						break
					default: // is "en-US"
						break
				}
			}
			funcs_.openFolder = (event = null) =>
			{
				switch(fs_.existsSync(Configuration.mainFolderPath.Value))
				{
					case false: try { fs_.mkdirSync(Configuration.mainFolderPath.Value); } catch (err) { console.warn(err.code); break; } // Try create folder
					default: child_process_.exec(`start "" "${Configuration.mainFolderPath.Value}"`); // Open Main folder in explorer
				}
			}
			funcs_.checkLibraries = () =>
			{
				if(!Configuration.ScaleSizeForPictures.Value.exp) { return }
				if(fs_.existsSync(pluginPath + resizePluginName + '.exe')) { return }
				Modals.showConfirmationModal(labelsNames.Modal_Missing, labelsNames.Modal_MissingLibs,
				{
					confirmText: labelsNames.Modal_OkDownload,
					cancelText: labelsNames.Modal_Cancel,
					onConfirm: () =>
					{
						https_.get("https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/ExtraMethods/gifsicle.exe", async (response) =>
						{ // gifsicle.exe by https://www.lcdf.org/gifsicle/
							await new Promise((e) => { response.pipe(fs_.createWriteStream( (path_.join(pluginPath, resizePluginName+'.exe')) )) });
						});
					}
				});
			}
			funcs_.scaleTo = (oldWidth, oldHeight, knownType, knownValue) =>
			{
				if(!knownType || !knownValue || !oldWidth || !oldHeight) { return }
				let newWidth = knownType == 'width' ? knownValue : null;
				let newHeight = knownType == 'height' ? knownValue : null;
				if(newWidth) { return Math.round(newHeight = (oldHeight / (oldWidth / newWidth))); }
				if(newHeight) { return Math.round(newWidth = (oldWidth / (oldHeight / newHeight))); }
			}
			funcs_.resizeGif = (gifPath, newWidth, newHeight) =>
			{
				if(!gifPath || !newWidth || !newHeight) { return false }
				if(!fs_.existsSync(pluginPath + resizePluginName + '.exe')) { console.warn(`${resizePluginName}.exe not found!`); return false }
				let gifsiclePath = pluginPath + resizePluginName;
				let gifsicleOutput = gifsiclePath + '.output';
				try
				{
					child_process_.execSync(`"${gifsiclePath}" "${gifPath}" --resize ${newWidth}x${newHeight} -o "${gifsicleOutput}"`);
				} catch(err) { console.log(err); }
				if(!fs_.existsSync(gifsicleOutput)) { console.warn("Why output file doesn't exist?!"); return false }
				let OutputData = fs_.readFileSync(gifsicleOutput);
				fs_.unlinkSync(gifsicleOutput);
				return OutputData;
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
				funcs_.checkLibraries();
				Configuration.ScaleSizeForPictures.Default = labelsNames.intNumber; // Fix placeholder
			}
			funcs_.setConfigValue = (event, key, newValue = null, specialKey = null) =>
			{
				//console.log(event, key, newValue, specialKey);
				if(!event || !key || newValue == null) { return false }
				if(!specialKey) { Configuration[key].Value = newValue; }
				else { Configuration[key].Value[specialKey] = newValue; }
				funcs_.saveConfiguration();
				return true
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
					let fileTypesAllow = ['.jpg', '.jpeg', '.bmp', '.png', '.webp', '.gif', srcType, sentType];
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
				let buttonCPFSP = document.getElementById(elementNames.CPFSP_buttonGoID);
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
						let buttonCPFSP = document.getElementById(elementNames.CPFSP_buttonGoID);
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
						document.getElementById(elementNames.CPFSP_buttonGoID).classList.remove(elementNames.CPFSP_activeButton);
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
					funcs_.setStyleFilter(undefined, 'delete'); // Remove last filter
					/*let previousButton = document.getElementById(buttonCPFSP.getAttribute('from'));
					try
					{ // Unselecting previous button
						previousButton.querySelector('button').classList.value = previousButton.querySelector('button').classList.value.replace('ButtonActive', 'Button');
					} catch(err) { console.warn(err); }*/

					// Adds buttons
					let buttonsPanel = document.createElement('div'); // Panel for buttons
					buttonsPanel.setAttribute('id', elementNames.buttonsPanel);
					let buttonRefresh = document.createElement('div'); // Refresh button
					buttonRefresh.setAttribute('class', elementNames.buttonDefault);
					buttonRefresh.setAttribute('command', 'refresh');
					buttonRefresh.innerText = labelsNames.btnRefresh;
					//buttonRefresh.removeEventListener('click', funcs_.moveToPicturesPanel); // Insurance
					buttonRefresh.addEventListener('click', funcs_.moveToPicturesPanel);
					buttonsPanel.append(buttonRefresh);
					let buttonOpenFolder = document.createElement('div'); // Open folder button
					buttonOpenFolder.setAttribute('class', elementNames.buttonDefault);
					buttonOpenFolder.innerText = labelsNames.btnOpenFolder;
					buttonOpenFolder.addEventListener('click', funcs_.openFolder);
					buttonsPanel.append(buttonOpenFolder);
					emojisPanel.insertBefore(buttonsPanel, emojisPanel.firstChild); // Adds button to panel
					// Adds search bar
					let SearchBarPanel = document.createElement('div'); // Panel for Search bar
					SearchBarPanel.setAttribute('class', elementNames.searchBar);
					let picturesSearch = document.createElement('input'); // Search in pictures with CSS filter
					picturesSearch.setAttribute('id', elementNames.searchBarInput);
					picturesSearch.setAttribute('placeholder', labelsNames.searchPicture);
					picturesSearch.addEventListener('input', funcs_.setStyleFilter);
					SearchBarPanel.append(picturesSearch);
					let picturesSearchOptions = document.createElement('select'); // Options select for Search bar
					picturesSearchOptions.addEventListener('change', funcs_.setStyleFilter);
					picturesSearchOptions.setAttribute('id', elementNames.searchBarOptions);
					picturesSearchOptions.add(new Option(labelsNames.filterAnyMatch, 'AnyMatch', true, true));
					picturesSearchOptions.add(new Option(labelsNames.filterStrictMatch, 'StrictMatch', false, false));
					picturesSearchOptions.add(new Option(labelsNames.filterAnyLetterCase, 'AnyLetterCase', false, false));
					picturesSearchOptions.add(new Option(labelsNames.filterInAnyPlace, 'InAnyPlace', false, false));
					SearchBarPanel.append(picturesSearchOptions)
					emojisPanel.insertBefore(SearchBarPanel, emojisPanel.firstChild);
					// Adds imgs preview
					let elementList = document.createElement('div');
					let folderSection = document.createElement('div');
					elementList.setAttribute('class', elementNames.elementList);
					emojisPanel.append(elementList); // Adds list to panel
					folderSection.setAttribute('class', elementNames.folderSection);
					let elementRow = document.createElement('ul');
					let rowIndex = 1;
					let colIndex = 1;
					let currentSection;
					async function setCurrentSection(folder)
					{ // Sets name to section with uses variables above
						currentSection = folder.name;
						if(currentSection === mainFolderName) { currentSection = Configuration.mainFolderNameDisplay.Value; }
						let textEl = document.createElement('text');
						textEl.innerText = currentSection;
						folderSection.append(textEl);
					}
					async function appendElements(folder, indexFolder, file, indexFile)
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
						elementCol.setAttribute('strictPicName', file.name); // This need for search bar
						elementCol.setAttribute('lowerPicName', file.name.toLowerCase()); // This need for search bar
						elementCol.setAttribute('role', 'gridcell');
						elementCol.setAttribute('aria-rowindex', rowIndex);
						elementCol.setAttribute('aria-colindex', colIndex);
						let newPicture = document.createElement('img');
						newPicture.setAttribute('width', imgPreviewSize.W); // for lazy loading
						newPicture.setAttribute('height', imgPreviewSize.H); // for lazy loading
						newPicture.setAttribute('loading', 'lazy'); // asynchronously img loading
						newPicture.setAttribute('onerror', `this.removeAttribute('onerror'); this.setAttribute('src', '${NotFoundIMG}');`);
						newPicture.setAttribute('path', file.link);
						try
						{
							if(file.link.indexOf('file:///') != -1)
							{ // Convert local file to base64 for preview
								fs_.promises.readFile(file.link.replace('file:///', '')) // Async creating base64 data
								.then(data => { newPicture.setAttribute('src', `data:image/${path_.extname(file.link).slice(1)};base64,${data.toString('base64')}`); })
								.catch(err => { newPicture.setAttribute('src', NotFoundIMG); });
							}
							else { newPicture.setAttribute('src', file.link); }
						} catch(err) { newPicture.setAttribute('src', NotFoundIMG); }
						newPicture.setAttribute('aria-label', file.name);
						newPicture.setAttribute('alt', file.name);
						newPicture.setAttribute('title', file.name); // For displaying pictures name
						newPicture.setAttribute('class', elementNames.newPicture);
						newPicture.addEventListener('click', funcs_.send2ChatBox);
						elementCol.append(newPicture); // Adds IMG to "li"
						elementRow.append(elementCol); // Adds "li" to "ul"
						colIndex++;
					}
					// DEBUG // console.log(allPicsSettings);
					allPicsSettings[folderListName].some((_folder, _indexFolder) =>
					{
						allPicsSettings[_folder.name].some((_file, _indexFile) =>
						{
							if(!document.getElementById(elementNames.CPFSP_panelID)) { return true; }
							appendElements(_folder, _indexFolder, _file, _indexFile);
						});
						folderSection.append(elementRow); // Adds emojis to special section
						elementList.append(folderSection); // Adds all sections to list
					});
				}
				creatingPanel();
			}
			funcs_.addPicturesPanelButton = (emojisGUI) =>
			{
				if(!emojisGUI) { return } // I know that in Discord there is no "s"
				// let emojiButton = document.querySelector('button[class*="emojiButton"]'); // Emojis button in chat
				let emojisMenu = emojisGUI.querySelector('div[aria-label*="Expression Picker"]'); // Panel menus
				if(!emojisMenu) { return }
				if(document.getElementById(elementNames.CPFSP_buttonGoID)) { return }
				let buttonCPFSP = document.createElement('button');
				buttonCPFSP.innerText = labelsNames.Pictures;
				buttonCPFSP.setAttribute('id', elementNames.CPFSP_buttonGoID);
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
				if(from.target.getAttribute('src') === NotFoundIMG) { return } // For not found images
				if(!!Configuration.SendingFileCooldown.Value && Number.isInteger(Configuration.SendingFileCooldown.Value) && Configuration.SendingFileCooldown.Value > 0)
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

				let _link = from.target.getAttribute('src'); // Only for events from clicking at imgs
				let _path = decodeURI(from.target.getAttribute('path').replace('file:///', '')); // I know this stupid, but file:/// I need for features, maybe..? Well
				let _name = from.target.getAttribute('alt');
				let _bufferFile = null;
				let isWebFile = _link.indexOf(';base64,') != -1 ? false : true;
				let isLocalFile = !isWebFile;
				let channelID = DiscordAPI.currentChannel.id; // or if from other library: BDFDB.ChannelUtils.getSelected().id
				let ChatBox = document.querySelector('div[class*="channelTextArea-"]').querySelector('div[role*="textbox"]'); // User's textbox, ZLibrary way: document.querySelector(DiscordSelectors.Textarea.channelTextArea.value).querySelector(DiscordSelectors.Textarea.textArea.value).childNodes[1]
				//let ChatBoxText = ChatBox ? Array.from(ChatBox.querySelectorAll('span')).pop() : null;
				if(!ChatBox) { return } // Stop method if user doesn't have access to chat

				if(Configuration.AutoClosePanel.Value)
				{
					if(document.getElementById(elementNames.CPFSP_buttonGoID) && !from.shiftKey)
					{ // Below code will run if panel is displayed && click without shift key
						let clickEvent = ChatBox.ownerDocument.createEvent('MouseEvents');
						clickEvent.initMouseEvent("mousedown", true, true, ChatBox.ownerDocument.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null); // Thanks stackoverflow.com ;)
						ChatBox.dispatchEvent(clickEvent);
					}
				}

				// Sending text
				if(Configuration.SendTextWithFile.Value)
				{ // Send text from textbox before send file
					if(ChatBox.innerText.length < 2002)
					{
						if(ChatBox.innerText.replace(/\s/g, '').length > 0) { DiscordAPI.currentChannel.sendMessage(ChatBox.innerText); } // For don't send empty message
					} // 2001 is limit for text length
					else { Modals.showAlertModal(`For you:`, `B-baka, your text wasn't sent with message because your text is over 2000 symbols!`); return } // or BdApi.showConfirmationModal
				}
				if(Object.keys(Configuration.ScaleSizeForPictures.Value).length && !from.ctrlKey)
				{ // Adds autoscaling parameters
					let scaleSize = { type: Configuration.ScaleSizeForPictures.Value.type, value: Configuration.ScaleSizeForPictures.Value.num };
					if(!(!scaleSize.type || !(0 < scaleSize.value) || !Number.isInteger(scaleSize.value)))
					{
						let naturalWidth = from.target.naturalWidth;
						let naturalHeight = from.target.naturalHeight;
						let newWidth, newHeight;
						let foundValue = funcs_.scaleTo(naturalWidth, naturalHeight, scaleSize.type, scaleSize.value);
						if(scaleSize.type.toLocaleLowerCase() == 'width') { newWidth = scaleSize.value; newHeight = foundValue; }
						if(scaleSize.type.toLocaleLowerCase() == 'height') { newWidth = foundValue; newHeight = scaleSize.value; }

						if(isWebFile && newWidth && newHeight)
						{
							_link = (_link+`?width=${newWidth}&height=${newHeight}`);
						}
						if(isLocalFile && newWidth && newHeight)
						{ // Sending local picture with scaled size
							let _dataType = _link.split(';base64,')[0].split('data:')[1];
							let _fileType = _dataType.split('/')[1];
							let _FileU8Array = Buffer.from(_link.split(';base64,')[1], 'base64');
							let isAnimated; // Detect if png or webp can containt animation. Gif anyway cannot be resized with standard canvas method properly
							if(_fileType == 'png') { isAnimated = (_FileU8Array.indexOf("acTL") != -1 && _FileU8Array.indexOf("IDAT") != -1) ? (_FileU8Array.indexOf("acTL") < _FileU8Array.indexOf("IDAT")) : null; }
							if(_fileType == 'webp') { isAnimated = (_FileU8Array.indexOf("VP8X") != -1 && _FileU8Array.indexOf("ANMF") != -1) ? (_FileU8Array.indexOf("VP8X") < _FileU8Array.indexOf("ANMF")) : null; }
							if(_fileType != 'gif' && !isAnimated)
							{
								let DisCanvas = document.createElement("canvas");
								let DisIMG = new Image();
								let DisBlob;
								DisIMG.src = _link;
								DisCanvas.width = newWidth;
								DisCanvas.height = newHeight;
								DisCanvas.getContext("2d").drawImage(DisIMG, 0, 0, newWidth, newHeight);
								DisCanvas.toBlob((e) =>
								{
									Promise.resolve(DisBlob = e).then((e) =>
									{
										uploadModule.upload(channelID, _file = new File([DisBlob], _name));
										lastSent = { file: _file, link: null };
										DisCanvas = null, DisIMG = null, DisBlob = null;
									})
								}, _dataType, 1);
								return // End method after sending resized picture
							}
							if(Configuration.ScaleSizeForPictures.Value.exp && _fileType == 'gif')
							{ // Special support for format
								// DisBlobResponse = await fetch(child_process_.execSync(`python ...`)); DisBlob = await DisBlobResponse.blob();
								_bufferFile = funcs_.resizeGif(_path, newWidth, newHeight)
								if(_bufferFile)
								{
									uploadModule.upload(channelID, _file = new File([_bufferFile], _name));
									lastSent = { file: _file, link: null };
									return
								}
							}
						}
					}
				}
				if(isLocalFile)
				{ // Sending local picture
					_bufferFile = _bufferFile ? _bufferFile : fs_.readFileSync(_path);
					uploadModule.upload(channelID, _file = new File([_bufferFile], _name)); // add ", {content:'new with file'}" for adding text
					lastSent = { file: _file, link: null };
					return
				}
				/* // DEPRECATED (c)0.0.1 version //
				_link = (escape(ChatBox.innerText) == "%uFEFF%0A") ? _link : `\n${_link}`; // "%uFEFF%0A" is empty chat value for Discord
				ComponentDispatchModule.dispatchToLastSubscribed(DiscordModules.DiscordConstants.ComponentActions.INSERT_TEXT, {
					content: `${_link}`
				}); // Adds text to user's textbox
				*/
				lastSent = { file: null, link: _link}; // For Last Sent option
				if(Configuration.SetLinkParameters.Value.length) { _link = (_link+Configuration.SetLinkParameters.Value); } // Adds user additional parameters
				return DiscordAPI.currentChannel.sendMessage(_link);  // Sending web picture
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
			funcs_.createSentFiles = (event) =>
			{
				console.log(event.file)
				/* let filePath, fileData;
				try { fs_.writeFileSync(filePath+sentType, JSON.stringify(fileData)); }
				catch(err) { console.warn(`There has been an error saving your ${sentType} file:`, err.message); }*/
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
						//DiscordModules.Dispatcher.subscribe(DiscordModules.DiscordConstants.ActionTypes.UPLOAD_COMPLETE, createSentFiles);
					} catch(err) { console.warn('There is error with starting plugin:', err); }
				}

				onStop()
				{
					try
					{
						funcs_.DiscordMenuObserver.disconnect();
						//DiscordModules.Dispatcher.unsubscribe(DiscordModules.DiscordConstants.ActionTypes.UPLOAD_COMPLETE, createSentFiles);
						funcs_.setStyles('delete');
						funcs_.setStyleFilter(undefined, 'delete');
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
					function _ScaleSizeForPictures()
					{
						let inputField = PanelElements.ScaleSizeForPictures.getElement().querySelector('input');
						if(!inputField || document.getElementById(elementNames.Config_scaleType)) { return }
						// List with width or height setting
						let selectList = document.createElement('select');
						selectList.setAttribute('id', elementNames.Config_scaleType);
						let isWidth = (Configuration.ScaleSizeForPictures.Value.type == 'width');
						let isHeight = (Configuration.ScaleSizeForPictures.Value.type == 'height');
						selectList.add(new Option(labelsNames.width, 'width', isWidth, isWidth));
						selectList.add(new Option(labelsNames.height, 'height', isHeight, isHeight));
						selectList.addEventListener('change', (e)=>funcs_.setConfigValue(e, 'ScaleSizeForPictures', document.getElementById(elementNames.Config_scaleType).value, 'type'));
						inputField.parentNode.append(selectList);
						// List with experimental setting
						let specialOptionDiv = document.createElement('div');
						specialOptionDiv.setAttribute('id', elementNames.Config_scaleExp);
						let isChecked = Configuration.ScaleSizeForPictures.Value.exp ? 'checked' : '';
						specialOptionDiv.innerHTML = `<text>${labelsNames.scaleExperimental}: </text><input type='checkbox' ${isChecked}>`;
						specialOptionDiv.querySelector('input').addEventListener('change', (e)=>funcs_.setConfigValue(e, 'ScaleSizeForPictures', document.querySelector(`#${elementNames.Config_scaleExp} input`).checked, 'exp'));
						inputField.parentNode.append(specialOptionDiv);
					}
					let detectCreation = new MutationObserver((mutationsList, observer) =>
					{ // For activating all additional functions after panel creation (can be replaced if used onAdded()). God is not contributor
						_ScaleSizeForPictures();
						observer.disconnect(); // Disconnect observer after panel creating
					});
					Panel.setAttribute('class', 'form');
					Panel.setAttribute('style', 'width:100%;');
					function createSetting(...args)
					{
						let type = args[0];
						if(!type) { return }
						switch(type)
						{
							//case 'Switch': return new Settings.Slider(args[1], args[2], 0, 1, Number(args[3]), args[4], { markers: [0, 1], stickToMarkers: true }); // Temporary fix
							case 'Switch': return new Settings.Switch(args[1], args[2], args[3], args[4], args[5]);
							case 'Textbox': return new Settings.Textbox(args[1], args[2], args[3], args[4], args[5]);
							case 'ColorPicker': return new Settings.ColorPicker(args[1], args[2], args[3], args[4], args[5]);
							case 'Keybind': return new Settings.Keybind(args[1], args[2], args[3], args[4], args[5]);
							case 'Dropdown': return new Settings.Dropdown(args[1], args[2], args[3], args[4], args[5], args[6]);
							case 'RadioGroup': return new Settings.RadioGroup(args[1], args[2], args[3], args[4], args[5], args[6]);
							case 'Slider': return new Settings.Slider(args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
							default: break;
						}
					}
					const PanelSG = new Settings.SettingGroup(`${this.getName()} (${this.getVersion()}) ${labelsNames.configMenu}`, { shown:true }).appendTo(Panel)
						// Use Sent Links
						.append(createSetting('Switch', Configuration.UseSentLinks.Title, Configuration.UseSentLinks.Description, Configuration.UseSentLinks.Value, checked =>
						{
							Configuration.UseSentLinks.Value = !!checked;
							funcs_.saveConfiguration();
						}))
						// Send Text With File
						.append(createSetting('Switch', Configuration.SendTextWithFile.Title, Configuration.SendTextWithFile.Description, Configuration.SendTextWithFile.Value, checked =>
						{
							Configuration.SendTextWithFile.Value = !!checked;
							funcs_.saveConfiguration();
						}))
						// Only Forced Update
						.append(createSetting('Switch', Configuration.OnlyForcedUpdate.Title, Configuration.OnlyForcedUpdate.Description, Configuration.OnlyForcedUpdate.Value, checked =>
						{
							Configuration.OnlyForcedUpdate.Value = !!checked;
							funcs_.saveConfiguration();
						}))
						// sentType to srcType
						.append(createSetting('Switch', Configuration.sentType2srcType.Title, Configuration.sentType2srcType.Description, Configuration.sentType2srcType.Value, checked =>
						{
							Configuration.sentType2srcType.Value = !!checked;
							funcs_.saveConfiguration();
						}))
						// Repeat Last Sent
						.append(createSetting('Switch', Configuration.RepeatLastSent.Title, Configuration.RepeatLastSent.Description, Configuration.RepeatLastSent.Value, checked =>
						{
							Configuration.RepeatLastSent.Value = !!checked;
							funcs_.saveConfiguration();
						}))
						// Auto Close Panel
						.append(createSetting('Switch', Configuration.AutoClosePanel.Title, Configuration.AutoClosePanel.Description, Configuration.AutoClosePanel.Value, checked =>
						{
							Configuration.AutoClosePanel.Value = !!checked;
							funcs_.saveConfiguration();
						}))
						// Sending File Cooldown
						.append(createSetting('Textbox', Configuration.SendingFileCooldown.Title, Configuration.SendingFileCooldown.Description, Configuration.SendingFileCooldown.Value, text =>
						{
							text = Number(text);
							if(!Number.isInteger(text)) { Configuration.SendingFileCooldown.Value = Configuration.SendingFileCooldown.Default; funcs_.saveConfiguration(); return }
							Configuration.SendingFileCooldown.Value = text;
							funcs_.saveConfiguration();
						}, { placeholder: Configuration.SendingFileCooldown.Default }))
						// Scale Size For Pictures
						.append(PanelElements.ScaleSizeForPictures = createSetting('Textbox', Configuration.ScaleSizeForPictures.Title, Configuration.ScaleSizeForPictures.Description, Configuration.ScaleSizeForPictures.Value.num, text =>
						{
							text = Number(text);
							if(9999 < text)
							{ // Against freezes
								text = 9999;
								setTimeout(()=>{ PanelElements.ScaleSizeForPictures.getElement().querySelector('input').value = 9999}, 200 );
								Modals.showAlertModal(labelsNames.Yamete, labelsNames.tooBig);
							}
							if(!Number.isInteger(text) || text <= 0) { Configuration.ScaleSizeForPictures.Value = ''; funcs_.saveConfiguration(); return }
							Configuration.ScaleSizeForPictures.Value = { type: document.getElementById(elementNames.Config_scaleType).value, num: Math.abs(Math.round(text)), exp: document.querySelector(`#${elementNames.Config_scaleExp} input`).checked };
							funcs_.saveConfiguration();
						}, { placeholder: Configuration.ScaleSizeForPictures.Default }))
						// Set Link Parameters
						.append(createSetting('Textbox', Configuration.SetLinkParameters.Title, Configuration.SetLinkParameters.Description, Configuration.SetLinkParameters.Value, text =>
						{
							Configuration.SetLinkParameters.Value = text;
							funcs_.saveConfiguration();
						}, { placeholder: Configuration.SetLinkParameters.Default }))
						// Main Folder Path
						.append(createSetting('Textbox', Configuration.mainFolderPath.Title, Configuration.mainFolderPath.Description, Configuration.mainFolderPath.Value, text =>
						{
							if(!text.length) { return }
							if(!fs_.existsSync(text)) { Configuration.mainFolderPath.Value = Configuration.mainFolderPath.Default; funcs_.saveConfiguration(); return }
							Configuration.mainFolderPath.Value = text;
							funcs_.saveConfiguration();
						}, { placeholder: Configuration.mainFolderPath.Default }))
						// Main Folder Name Display
						.append(createSetting('Textbox', Configuration.mainFolderNameDisplay.Title, Configuration.mainFolderNameDisplay.Description, Configuration.mainFolderNameDisplay.Value, text =>
						{
							if(!text.length) { return }
							Configuration.mainFolderNameDisplay.Value = text;
							funcs_.saveConfiguration();
						}, { placeholder: Configuration.mainFolderNameDisplay.Default }))
						// Section Text Color
						.append(createSetting('ColorPicker', Configuration.SectionTextColor.Title, Configuration.SectionTextColor.Description, Configuration.SectionTextColor.Value, color =>
							{
								Configuration.SectionTextColor.Value = color;
								funcs_.saveConfiguration();
								funcs_.setStyles('delete');
								funcs_.setStyles();
						}));
					detectCreation.observe(PanelSG.getElement(), { childList: true, subtree: true }); // wait for creating panel
					return Panel;
				}

			};

		}; return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
