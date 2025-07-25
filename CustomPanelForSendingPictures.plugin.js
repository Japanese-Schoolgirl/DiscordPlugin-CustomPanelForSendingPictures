/**
 * @name CustomPanelForSendingPictures
 * @author Japanese Schoolgirl (Lisa)
 * @description Adds panel that loads pictures via settings file with used files and links, allowing you to send pictures in chat with or without text by clicking on pictures preview on the panel. Settings file is automatically created on scanning the plugin folder or custom folder (supports subfolders and will show them as sections/groups).
 * @authorId 248447383828955137
 * @authorLink https://github.com/Japanese-Schoolgirl
 * @invite nZMbKkw
 * @website https://github.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures
 * @source https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/CustomPanelForSendingPictures.plugin.js
 * @updateUrl https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/CustomPanelForSendingPictures.plugin.js
 * @version 0.6.7
 */

/*========================| Info |========================*/
const config =
{
	changelog:
	[
		{
			title: `Fixed a panel's bug with the new Soundmoji button`,
			type: "fixed", // without type || fixed || improved || progress
			items: [`Fixed a display bug with plugin's main button caused by the new Soundmoji button. Also SendTextWithFile setting is now turned on by default.`]
		}
	],
	info:
	{
		name: "CustomPanelForSendingPictures",
		author_details:
		{
				name: "Japanese Schoolgirl (Lisa)",
				github_username: "Japanese-Schoolgirl",
				discord_server: "https://discord.gg/nZMbKkw",
				steam_link: "https://steamcommunity.com/id/EternalSchoolgirl/",
				twitch_link: "https://www.twitch.tv/EternalSchoolgirl"
		},
		github: "https://github.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures",
		github_raw: "https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/main/CustomPanelForSendingPictures.plugin.js"
	}
};
/*========================| Essential functions |========================*/
const getModule_ = (module) => 
{ // || window.require;
	try { return require(module); }
	catch(err) { console.warn(err); return false; };
};
const PluginApi_ = window.BdApi ? window.BdApi : window.alert("PLUGIN API NOT FOUND"); // Window scope is needed here
const BufferFromFormat_ = getModule_("buffer").from; /*(content, format) =>
{// This library will be used when the "Buffer" module breaks: https://unpkg.com/base64-js@1.5.1/base64js.min.js
	if(format == "base64") { return base64js.toByteArray(content); } else { return Uint8Array.from(content, (v) => v.charCodeAt(0)); }
}*/
/*========================| Modules |========================*/
const request_ = PluginApi_.Net.fetch; // or getModule_("request");
const electron_ = getModule_("electron");
const fs_ = getModule_("fs");
const path_ = getModule_("path");
const open_folder_ = electron_ ? electron_.shell.openPath : false;

const uploadClass = PluginApi_.Webpack.getModule(m => m.prototype && m.prototype.upload && m.prototype.getSize && m.prototype.cancel, { searchExports: true });
const messageModule = (channelID, sendText = null, replyIDs = null, file = null) =>
{
	if(!channelID || (!sendText && !file)) { return console.warn("What"); }

	try
	{
		// Replace for broken DiscordAPI.currentChannel.sendMessage
		let SEND = PluginApi_.findModule(m => m._sendMessage && typeof m._sendMessage === "function")._sendMessage;
		if(replyIDs) { if(replyIDs.channel !== channelID) { channelID = replyIDs.channel; console.warn("There something strange with replyIDs.channel and channelID"); } };

		SEND(channelID, { content: sendText, validNonShortcutEmojis: Array(0) }, {
			...(replyIDs ? { messageReference: {channel_id: replyIDs.channel, message_id: replyIDs.message} } : {}),
			...(file ? { attachmentsToUpload: [new uploadClass({file: file, platform: 1}, channelID, false, 0)] } : {})
		});
	} catch(err) { console.warn(err); }
};
/*========================| DEPRECATED |========================*/
/*
# Buffer_ replaced with BufferFromFormat_:
const Buffer_ = typeof Buffer !== "undefined" ? Buffer : getModule_("buffer").Buffer;
# Modules that have stopped working:
const util_ = getModule_("util");
# Might be useful later:
const https_ = getModule_("https");
const ComponentDispatchModule = PluginApi_.findModule(m => m.ComponentDispatch && typeof m.ComponentDispatch === "object").ComponentDispatch; // For insert text with .dispatchToLastSubscribe and etc.
*/

/*========================| Core |========================*/
//-----------| Create Settings and Variables |-----------//
var picsGlobalSettings = {};
var pluginPath, settingsPath, configPath, picturesPath, DiscordLanguage, isWindows;
pluginPath = PluginApi_.Plugins.folder;
settingsPath = path_.join(pluginPath, config.info.name + '.settings.json');
configPath = path_.join(pluginPath, config.info.name + '.configuration.json');
picturesPath = path_.join(pluginPath, config.info.name);
DiscordLanguage = navigator.language; // Output is "en-US", "ru" etc.
isWindows = navigator.userAgentData.platform.toLowerCase() == 'windows' ? true : false; // For not Windows OS support
// Thread window causes a existence of a second textarea. The plugin prioritizes thread textarea
var getDiscordTextarea = () =>
{
	let textarea = document.querySelectorAll('div[class*="channelTextArea"]');
	if(!textarea.length) { return }
	return textarea[textarea.length-1]; // Prioritizes a thread window
};
var lastSent = {};
let sendingCooldown = {time: 0, duration: 0};
let sentType = '.sent';
let srcType = '.src';
let emptyIMG = 'data:image/gif;base64,R0lGODlhAQABAHAAACH5BAEAAAAALAAAAAABAAEAgQAAAAAAAAAAAAAAAAICRAEAOw==';
let NotFoundIMG = 'https://i.imgur.com/r0OCBLX.png'; // Old is 'https://i.imgur.com/jz767Z6.png', src as base64 also ok;
let imgPreviewSize = {W: '48px', H: '48px'};
let mainFolderName = 'Main folder!/\\?'; // It'll still be used for arrays and objects. Change in configuration only affects at section's name
let folderListName = `?/\\!FolderList!/\\?`;
var Configuration = { // Almost all Default values need only as placeholder
	CheckForUpdates:		{ Value: true, 															Default: true, 						Title: `Check for updates`, 							Description: `Enables built-in update checking.` },
	UseSentLinks:			{ Value: true, 															Default: true, 						Title: `Use "Sent Links"`, 								Description: `To create and use ${sentType} files that are replacing file sending by sending links.` },
	SendTextWithFile:		{ Value: true, 														Default: true, 					Title: `Send text from textbox with sending file`, 	Description: `To send text from textbox with sending local or web file. Doesn't delete text from textbox. Doesn't send message over 2000 symbols limit.` },
	OnlyForcedUpdate:		{ Value: false, 														Default: false, 					Title: `Only forced update`, 							Description: `Doesn't allow plugin to automatically update settings via scan with used files without user interaction.` },
	sentType2srcType:		{ Value: false, 														Default: false, 					Title: `Treat ${sentType} as ${srcType}`, 				Description: `To use ${sentType} as ${srcType}.` },
	RepeatLastSent:			{ Value: false, 														Default: false, 					Title: `Repeat last sent`, 								Description: `To use Alt+V hotkey for repeat sending your last sent file or link (without text) to current channel.` },
	SizeLimitForFile:		{ Value: true, 															Default: true, 						Title: `Prevent sending files larger than 10 MB`, 		Description: `Prevents a message from being sent if the file size is larger than 10 MB.` },
	AutoClosePanel:			{ Value: false, 														Default: false, 					Title: `Auto close panel`, 								Description: `To autoclose pictures panel after sending any file when pressed without Shift modificator key.` },
	SendingFileCooldown:	{ Value: 0, 															Default: '0', 						Title: `Sending file cooldown`, 						Description: `To set cooldown in millisecond before you can send another file. Set 0 in this setting to turn this off. This option exists to prevent double/miss clicks so it doesn't apply to hotkey sending.` },
	ScaleSizeForPictures:	{ Value: { type: 'width', num: '45', subpanel: true, exp: false }, 		Default: '', 						Title: `Set size for scaling (on by default)`, 			Description: `For automatic proportional scaling of pictures from local or web files to set size. Value is set only either for width or height. Clicking while holding Ctrl key will ignore enabling of this option. Remove value in this setting to turn this off.` },
	SetLinkParameters:		{ Value: '', 															Default: '?width=45&height=45', 	Title: `Set parameters for web file (off by default)`, 	Description: `To automatically add custom parameters for sending links. Remove value in this setting to turn this off.` },
	mainFolderPath:			{ Value: picturesPath, 													Default: picturesPath, 				Title: `There is your folder for pictures:`, 			Description: `You can set your Main folder which will be scanned for pictures and subfolders. Please try to avoid using folders with very big amount of files. Chosen directory should already exist.` },
	mainFolderNameDisplay:	{ Value: 'Main folder', 												Default: 'Main folder', 			Title: `Displayed section name for Main folder`, 		Description: `You can set this section name to Main folder:` },
	SectionTextColor:		{ Value: '#000000bb', 													Default: '#000000bb', 				Title: `Section's name color`, 							Description: `Your current color is:` },
};
//-----------|  Start of Styles section |-----------//
var CPFSP_Styles = () => { return ` /* Extract from "emojiList" and etc classes + additional margin and fixes */
:root {
	--sectionText: ${Configuration.SectionTextColor.Value};
	--sectionTextFlash: rgba(255, 0, 0, 0.2);
}
@keyframes spin360 {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}
@keyframes loadingCircle {
	0% {
		box-shadow: 2px 3px 4px var(--sectionTextFlash) inset,
		2px 2px 2px var(--sectionText) inset,
		2px -2px 2px var(--sectionText) inset;
	}
	100% {
		box-shadow: 2px 3px 4px var(--sectionTextFlash) inset,
		2px 2px 2px var(--sectionText) inset,
		2px -2px 2px var(--sectionText) inset;
	}
}
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
	color: var(--sectionText); /* color: var(--header-primary); */
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
	/* background-image: linear-gradient(to bottom, var(--sectionText) 0%, var(--sectionTextFlash) 100%); */
}
.CPFSP_li[waitload] {
	box-shadow: 2px 3px 4px var(--sectionText) inset; /* in case if animation not starts */
	border-radius: 50%;
	animation: spin360 1s linear infinite, loadingCircle 2s alternate infinite; /* Causes lags */
}
.CPFSP_IMG {
	min-width: ${imgPreviewSize.W};
	max-width: ${imgPreviewSize.W};
	min-height: ${imgPreviewSize.H};
	max-height: ${imgPreviewSize.H};
	cursor: pointer;
	background-size: 48px 48px;
}
.CPFSP_li[waitload] .CPFSP_IMG {
	content: url(${emptyIMG});
}
#CPFSP_btnsPanel, #CPFSP_scaleSubpanelID {
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
#CPFSP_spoilerCheckbox {
	max-width: 22px;
	color: var(--channels-default);
	background-color: var(--background-tertiary);
	border-radius: 0px 0px 10px 0px;
	z-index: 1;
}
#CPFSP_spoilerCheckbox input {
	margin-left: 5px;
	transform: scale(1.5);
	vertical-align: middle;
}
#CPFSP_spoilerCheckbox p {
	margin: 0px 0px 10px 2px;
	line-height: 1;
	writing-mode: vertical-lr;
	text-orientation: upright;
	font-weight: bolder;
}
#CPFSP_scaleSubpanelID {
	position: absolute;
	justify-content: right;
	grid-template-columns: none;
}
#CPFSP_scaleSubpanelID input {
	max-width: 75px;
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
#CPFSP_scaleExp, #CPFSP_scaleSubpanel {
	color: var(--channels-default);
	font-weight: 600;
}
#CPFSP_scaleExp input, #CPFSP_scaleSubpanel input {
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

var searchNames = {
	emojisGUI:				'div[role="tablist"]', // Panel with menu and buttons (aria label is Expression Picker)
	emojisPanel:			'div[role="tabpanel"]', // Or emojisGUI.lastElementChild (cause bug with scale subpanel);
	emojisClassGUI:			'div[class*="contentWrapper"]' // Whole panel
}

var elementNames = {
	id: 					'CPFSP_StyleSheet',
	filter: 				'CPFSP_StyleFilter',
	CPFSP_panelID: 			'CPFSP_Panel',
	CPFSP_scalePanelID: 	'CPFSP_scaleSubpanelID',
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
	spoilerCheckbox: 		'CPFSP_spoilerCheckbox',
	searchBar: 				'CPFSP_searchBar',
	searchBarInput: 		'CPFSP_searchBarInput',
	searchBarOptions: 		'CPFSP_searchBarOptions',
	emojiTabID:				'emoji-picker-tab',
	gifTabID: 				'gif-picker-tab',
	stickerTabID: 			'sticker-picker-tab',
	soundmojiTabID: 		'soundboard-picker-tab',
	Config_scaleType: 		'CPFSP_scaleType',
	Config_scaleSubpanel: 	'CPFSP_scaleSubpanel',
	Config_scaleExp: 		'CPFSP_scaleExp',
}

var labelsNames = {
	Modal_OkDownload: 		`Download Now`,
	Modal_Cancel: 			`Cancel`,
	Modal_Missing: 			`Library Missing`,
	Modal_MissingLibs: 		`The library plugin needed for turned on options in plugin ${config.info.name} is missing. Please click "Download Now" to install it.`,
	Constants_Missing:		`Some importants constants in plugin ${config.info.name} is missing`,
	Yamete: 				`Yamete!`,
	tooBig: 				`It's too big!`,
	forYou: 				`For you:`,
	symbolsLimit: 			`B-baka, your text wasn't sent with image because your text is over 2000 symbols!`,
	filesizeLimit: 			`B-baka, your message wasn't sent because your file size is larger than 10 MB!`,
	Pictures: 				`Pictures`,
	btnRefresh: 			`Refresh`,
	btnOpenFolder: 			`Open folder`,
	btnFolderPath: 			`Folder path`,
	searchPicture: 			`Search picture`,
	spoilerCheckbox: 		`Spoiler`,
	spoilerTooltip: 		`If it is checked, then links and files will be sent as spoilers`,
	filterAnyMatch: 		`Any match`,
	filterStrictMatch: 		`Strict match`,
	filterAnyLetterCase: 	`Case-insensitive`,
	filterInAnyPlace: 		`In any place`,
	configMenu: 			`Configuration Menu`,
	width: 					`Width`,
	height: 				`Height`,
	intNumber: 				`Integer number`,
	scaleSubpanel: 			`Adds the subpanel for image resizing to the emoji panel`,
	scaleExperimental: 		`Experimental support for animations (will be used external module)`
}

var funcs_ = {}; // Object for store all custom functions
var tempVars_ = {}; // Object for store all temp vars
//-----------|  End of Styles section |-----------//

//-----------|  Functions |-----------//
funcs_.versionCheck = (this_plugin) =>
{
	config.info.version = this_plugin.meta.version;
	config.info.description = this_plugin.meta.description;

	const previousVersion = this_plugin.api.Data.load("version");
	if(previousVersion !== config.info.version)
	{
		this_plugin.api.UI.showChangelogModal({
			title: this_plugin.meta.name,
			subtitle: config.info.version,
			blurb: "If you think the automatic updates are broken (and there is a chance for this), you can check for the latest version here: https://raw.githubusercontent.com/Japanese-Schoolgirl/DiscordPlugin-CustomPanelForSendingPictures/refs/heads/main/CustomPanelForSendingPictures.plugin.js",
			changes: config.changelog
		});
		this_plugin.api.Data.save("version", this_plugin.meta.version);
	}
}
funcs_.updateCheck = (this_plugin) =>
{
	// Does not check for updates if they are not needed
	if(!Configuration.CheckForUpdates.Value) { return }

	function downloadNewVersion()
	{
		PluginApi_.showConfirmationModal(`Update ${config.info.name}?`, `If plugin's built-in updater conflicts in any way, you can always disable its update checking in the settings.`,
			{
				confirmText: "Update Now",
				cancelText: "Cancel",
				onConfirm: () =>
				{
					request_(this_plugin.getUpdateURL()).then(r => {
						if (!r || r.status != 200) throw new Error();
						else return r.text();
					}).then(b => {
						if (!b) throw new Error();
						else return fs_.writeFile(path_.join(PluginApi_.Plugins.folder, "CustomPanelForSendingPictures.plugin.js"), b, _ => PluginApi_.showNotice("Finished downloading!", {type: "success"}));
					}).catch(err => {
						PluginApi_.showNotice("Error", `Could not download latest version. Try again later or download it manually from GitHub: ${config.info.github_raw}`);
					});
				}
			});
	}

	fetch(this_plugin.getUpdateURL())
	.then(response => response.text())
	.then(data =>
	{
		const versionRegEx = /(\* @version [0-9]+\.[0-9]+\.[0-9]+)/;
		const match = data.match(versionRegEx);
		if(match)
		{
			const latestVersion = match[1].match(/[0-9]+\.[0-9]+\.[0-9]+/)[0];
			console.log(`Latest version for ${config.info.name} is ${latestVersion}. Your is ${config.info.version}`);
			// Compare the latest version with your current version
			if(latestVersion !== config.info.version)
			{
				PluginApi_.UI.showNotice(`Update for ${config.info.name} is available! Your current version is ${config.info.version}. Latest version is ${latestVersion}`);
				downloadNewVersion();
			}
		} else { console.warn(`Failed to extract version number for ${config.info.name} :<`); }
	})
	.catch(err => console.error(`Error fetching version file for ${config.info.name}:`, err));
}
funcs_.warnsCheck = () =>
{
	if(!(PluginApi_.UI)) { console.warn(labelsNames.Constants_Missing); }
}
funcs_.showAlert = PluginApi_.UI.alert; // Old function is Modals.showAlertModal;
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
	switch(DiscordLanguage)
	{
		case 'ru':
			config.info.description = `Добавляет панель, которая подгружает картинки через файл настроек с используемыми файлами и ссылками, позволяя отправлять картинки с текстом или без текста нажатием по превью картинок на панели. Файл настроек автоматически создаётся при сканировании выбранной папки или папки плагина (поддерживает подпапки и будет отображать их как секции/группы).`; // Only config constanta, not keys inside
			labelsNames.Modal_OkDownload = `Скачать сейчас`;
			labelsNames.Modal_Cancel = `Отмена`;
			labelsNames.Modal_Missing = `Отсутствует библиотека`;
			labelsNames.Modal_MissingLibs = `Отсутствует библиотека, необходимая для работы включённых опций в плагине ${config.info.name}. Пожалуйста, нажмите "${labelsNames.Modal_OkDownload}" для её установки.`;
			labelsNames.Constants_Missing = `Отсутствуют некоторые константы, важные для плагина ${config.info.name}.`;
			labelsNames.Yamete = `Ямете!`;
			labelsNames.tooBig = `Это слишком велико!`;
			labelsNames.forYou = `Для тебя:`;
			labelsNames.symbolsLimit = `Б-бака, твой текст не был отправлен с файлом, потому что в нём больше 2000 символов!`;
			labelsNames.filesizeLimit = `Б-бака, твоё сообщение не было отправлено, потому что размер файла больше 10 МБ!`;
			labelsNames.Pictures = `Картинки`;
			labelsNames.btnRefresh = `Обновить`;
			labelsNames.btnOpenFolder = `Открыть папку`;
			labelsNames.btnFolderPath = `Путь папки`;
			labelsNames.searchPicture = `Искать картинку`;
			labelsNames.spoilerCheckbox = `Спойлер`;
			labelsNames.spoilerTooltip = `Если отмечено галочкой, то ссылки и файлы отправляются как спойлеры`;
			labelsNames.filterAnyMatch = `Любое совпадение`;
			labelsNames.filterStrictMatch = `Строгое совпадение`;
			labelsNames.filterAnyLetterCase = `Любой регистр`;
			labelsNames.filterInAnyPlace = `В любом месте`;
			labelsNames.configMenu = `Меню Конфигурации`;
			labelsNames.width = `Ширина`;
			labelsNames.height = `Высота`;
			labelsNames.intNumber = `Целое число`;
			labelsNames.scaleSubpanel = `Добавляет субпанель для масштабирования картинок к панели с эмодзи`;
			labelsNames.scaleExperimental = `Экспериментальная поддержка анимаций (будет использоваться посторонний модуль)`;
			Configuration.CheckForUpdates.Title = `Проверять обновления`;
			Configuration.CheckForUpdates.Description = `Включает встроенную проверку обновлений.`;
			Configuration.UseSentLinks.Title = `Использовать "Отправленные Ссылки"`;
			Configuration.UseSentLinks.Description = `Включает создание и использование ${sentType} файлов, которые заменяют отправку файлов отправкой ссылок.`;
			Configuration.SendTextWithFile.Title = `Отправлять текст из чата с отправляемым файлом`;
			Configuration.SendTextWithFile.Description = `Включает отправку текста из чата с отправляемым локальным или веб файлом. Не удаляет текст из чата. Не отправляет сообщение превышающее 2000 символов.`;
			Configuration.OnlyForcedUpdate.Title = `Только принудительное обновление`;
			Configuration.OnlyForcedUpdate.Description = `Не позволяет плагину автоматически обновлять настройки через сканирование с используемыми файлами без участия пользователя.`;
			Configuration.sentType2srcType.Title = `Рассматривать ${sentType} как ${srcType}`;
			Configuration.sentType2srcType.Description = `Для использования ${sentType} в качестве ${srcType}.`;
			Configuration.RepeatLastSent.Title = `Повторение последний отправки`;
			Configuration.RepeatLastSent.Description = `Включает использование сочетания клавиш Alt+V для повторения отправки последнего отправленного файла или ссылки (без текста) в текущий канал.`;
			Configuration.SizeLimitForFile.Title = `Не отправлять файл размером больше 10 МБ`;
			Configuration.SizeLimitForFile.Description = `Предотвращает отправку сообщения, если размер отправляемого файла в нём больше 10 МБ.`;
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
	function openMethod()
	{
		if(open_folder_)
		{
			// For Linux child_process_.exec(`xdg-open "${Configuration.mainFolderPath.Value}"`);
			// let openFolderMethod = isWindows ? `start ""` : `xdg-open`;
			// child_process_.exec(`${openFolderMethod} "${Configuration.mainFolderPath.Value}"`);
			// New method (via "electron" module):
			open_folder_(Configuration.mainFolderPath.Value);
		}
		else { funcs_.showAlert(labelsNames.btnFolderPath + ":", Configuration.mainFolderPath.Value); }
	}
	switch(fs_.existsSync(Configuration.mainFolderPath.Value))
	{
		case false: try { fs_.mkdirSync(Configuration.mainFolderPath.Value); } catch (err) { console.warn(err.code); break; } // Try create folder
		default: openMethod(); // Open Main folder in explorer
	}
}
funcs_.checkLibraries = async () =>
{
	if(!Configuration.ScaleSizeForPictures.Value.exp) { return }
	// For latest version: https://unpkg.com/gifsicle-wasm-browser/dist/gifsicle.min.js || https://cdn.jsdelivr.net/npm/gifsicle-wasm-browser/dist/gifsicle.min.js 
	funcs_.gifsicle = await import("https://unpkg.com/gifsicle-wasm-browser@1.5.16/dist/gifsicle.min.js").then((module) => { return module.default; });
}
funcs_.readLocalFile = (filePath, format, sendFile) =>
{
	if(!filePath) { return false }

	if(!format) { return fs_.readFileSync(filePath); }
	if(!sendFile) { return fs_.readFileSync(filePath, { encoding: format }); }
	return BufferFromFormat_(fs_.readFileSync(filePath, { encoding: format }), format);
}
// Currently not working: "fs_.promises" & "util_.promisify()"
funcs_.readLocalFileAsync = (filePath, format) =>
{
	return new Promise((resolve, reject) =>
	{
		fs_.readFile(filePath, format, (err, data) =>
		{
			if(err) { reject(err); }
			else { resolve(data); }
		})
	});
}
funcs_.writeFile = (filePath, content) =>
{ // Async alternative for fs_.writeFileSync
	fs_.writeFile(filePath, content, (err) =>
	{
		if(err) { throw err };
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
funcs_.resizeGif = async (gifPath, newWidth, newHeight, gifName) =>
{
	if(!gifPath || !newWidth || !newHeight) { return false }
	/* Deprecated gifsicle.exe method
	if(!fs_.existsSync(path_.join(pluginPath, resizePluginName + '.exe'))) { console.warn(`${resizePluginName}.exe not found!`); return false }
	let gifsiclePath = path_.join(pluginPath, resizePluginName);
	let gifsicleOutput = gifsiclePath + '.output';
	try
	{
		child_process_.execSync(`"${gifsiclePath}" "${gifPath}" --resize ${newWidth}x${newHeight} -o "${gifsicleOutput}"`);
	} catch(err) { console.warn(err); }
	if(!fs_.existsSync(gifsicleOutput)) { console.warn("Why output file doesn't exist?!"); return false }
	let outputData = funcs_.readLocalFile(gifsicleOutput, "base64", true);
	fs_.unlinkSync(gifsicleOutput);
	*/

	var outputData;
	try
	{
		let inputName = "gifsicleInput";
		let outputName = "gifsicleOutput";
		let gifFile = (new File([funcs_.readLocalFile(gifPath, "base64", true)], inputName));
		outputData = funcs_.gifsicle.run({
			input: [{ file: gifFile, name: inputName }],
			command: [`${inputName} --resize ${newWidth}x${newHeight} -o /out/${outputName} `]
		}).then((outfiles) => { return outfiles[0]; });
	} catch(err) { console.warn(err); }
	return await outputData;
}
funcs_.saveSettings = (data, once = null) =>
{
	if(Object.keys(data).length < 2) { return funcs_.loadDefaultSettings(); } // This happen when folder is empty
	try { funcs_.writeFile(settingsPath, JSON.stringify(data)); }
	catch(err) { console.warn('There has been an error saving your setting data:', err.message); }
	if(once) { return picsGlobalSettings; } // to avoid endless engine
	return funcs_.loadSettings();
	// DEBUG // console.log('Path: ', __dirname);
}
funcs_.loadSettings = (anotherTry = null) =>
{
	let newPicsGlobalSettings = {};
	if(!fs_.existsSync(settingsPath)) { return funcs_.loadDefaultSettings(); } // This happen when settings file doesn't exist
	try { newPicsGlobalSettings = JSON.parse(funcs_.readLocalFile(settingsPath)); }
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
	picsSettings = [ { name: 'AnnoyingLisa', link: 'https://i.imgur.com/l5Jf0VP.png' }, { name: 'AngryLisaNoises', link: 'https://i.imgur.com/VMXymqg.png'} ]; // Placeholder
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
	try { newData = JSON.parse(funcs_.readLocalFile(configPath)); }
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
	try { funcs_.writeFile(configPath, JSON.stringify(exportData)); }
	catch(err) { console.warn('There has been an error saving your config data:', err.message); }
	funcs_.loadConfiguration();
}
funcs_.createSetting = (...args) =>
{
	let type = args[0];
	if(!type) { return }
	switch(type)
	{
		//case 'Switch': return new Settings.Slider(args[1], args[2], 0, 1, Number(args[3]), args[4], { markers: [0, 1], stickToMarkers: true }); // Temporary fix
		case 'Switch': return new Settings.Switch(args[1], args[2], args[3], args[4], args[5]);
		case 'Textbox': return new Settings.Textbox(args[1], args[2], args[3], args[4], args[5]);
		case 'ColorPicker': return new Settings.Textbox(args[1], args[2], args[3], args[4], args[5]); // Temporary fix
		//case 'ColorPicker': return new Settings.ColorPicker(args[1], args[2], args[3], args[4], args[5]);
		case 'Keybind': return new Settings.Keybind(args[1], args[2], args[3], args[4], args[5]);
		case 'Dropdown': return new Settings.Dropdown(args[1], args[2], args[3], args[4], args[5], args[6]);
		case 'RadioGroup': return new Settings.RadioGroup(args[1], args[2], args[3], args[4], args[5], args[6]);
		case 'Slider': return new Settings.Slider(args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
		default: break;
	}
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
funcs_.closeCurrentReply = () =>
{ // Exits ALL selected replies by it's close button
	// "DiscordSelectors.Textarea.attachedBars" stopped working
	let replyCloseButton = document.querySelectorAll('div[class*="replyBar"] div[class*="closeButton"]');
	if(!getDiscordTextarea() || !replyCloseButton.length) { return }
	try { replyCloseButton.forEach((el) => el.click()); } catch(err) { console.error(err) };
}
funcs_.getCurrentReply = () =>
{ // Currently it not implement with threads properly. querySelectorAll(...)[1] is for thread
	let replyMessage = document.querySelectorAll('div[class*="replying"][data-list-item-id*="chat-messages"]');
	if(!getDiscordTextarea() || !replyMessage.length) { return }
	replyMessage = replyMessage[replyMessage.length-1]; // Prioritizes a thread window

	let replyIDs = replyMessage.getAttribute("data-list-item-id").match(/(\d+)/g).slice(-2); // Receives only the last two sets of digits (server-id and message-id)
	if(!replyIDs) { return }
	return { channel: replyIDs[0], message: replyIDs[1] }
	// New code
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
		let filePath = path_.join(scanPath, file);
		let webLink;
		if(isFolder && isFirstScan) { foldersForScan.push({name: file, path: filePath }); } // Add each folder only in this cycle due isFirstScan there prevents scans subfolders in subfolders. However this code not organize for subsubsubsubfolders scan yet
		if(isFolder && isFirstScan && !absoluteIndex) { newPicsSettings[index] = { name: 'Placeholder', link: 'https://i.imgur.com/VMXymqg.png?AlwaysSendThisImageToNextUniverse/\\?????' }; } // Adds as placeholder only once due Main folder can't be "emtpy"
		if(fileTypesAllow.indexOf(fileType) == -1) { return } // Check at filetype
		if(fileType == sentType || fileType == srcType)
		{
			try { webLink = JSON.parse(funcs_.readLocalFile(filePath)); }
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
			if((placeholder.name === 'Placeholder') && (placeholder.link === 'https://i.imgur.com/VMXymqg.png?AlwaysSendThisImageToNextUniverse/\\?????'))
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
	let emojisPanel = emojisGUI.querySelector(searchNames.emojisPanel) || document.querySelector('div[class*="soundboardContainer_"]'); // Silly fix for soundmoji tab
	if(!emojisPanel) { return }

	let allPicsSettings;
	//# Previous button click fix: START
	let emojisMenu = emojisGUI.querySelector(searchNames.emojisGUI);
	let previousButton = emojisMenu.querySelector('div[class*="navButton_"][aria-selected*="true"]'); // Will return Button tag
	let previousButtonID = previousButton ? previousButton.id : null;
	if(previousButtonID)
	{
		buttonCPFSP.setAttribute('from', previousButtonID); // Necessary for fixing previous button
		function previousButtonFix(event)
		{
			let buttonCPFSP = document.getElementById(elementNames.CPFSP_buttonGoID);
			let from = buttonCPFSP.getAttribute('from');
			let fix = (from == elementNames.emojiTabID) ? elementNames.gifTabID : elementNames.emojiTabID;
			// Select other button and after this select previous button again
			document.getElementById(fix).addEventListener("click", document.getElementById(from).click(), { once: true } ); // Maybe not better idea
			document.getElementById(fix).click();
			buttonCPFSP.classList.remove(elementNames.CPFSP_activeButton);
			// DEBUG // console.log('Fixed', event);

			removeScaleSubpanel();
		}
		function additionalButtonFix(event)
		{
			let buttonCPFSP = document.getElementById(elementNames.CPFSP_buttonGoID);
			buttonCPFSP.classList.remove(elementNames.CPFSP_activeButton);

			removeScaleSubpanel();
		}
		function removeScaleSubpanel()
		{ // Fix for Subpanel for scaling images
			let scaleSubpanel = document.getElementById('CPFSP_scaleSubpanelID');
			if(scaleSubpanel) { scaleSubpanel.remove() };
		}
		try
		{ // Unselecting previous button
			previousButton.addEventListener("click", previousButtonFix, { once: true } );
			previousButton.classList.value = previousButton.classList.value.replace('ButtonActive', 'Button');
			// To not choose the already selected
			let buttons = emojisMenu.querySelectorAll('div[class*="navButton_"]');
			buttons.forEach((el) =>
			{ // For each Button with label
				if(el.id == previousButtonID || el.id == elementNames.CPFSP_buttonGoID) { return }
				el.removeEventListener("click", additionalButtonFix, { once: true } ); // Just in cases of incidental duplicate
				el.addEventListener("click", additionalButtonFix, { once: true } );
				el.classList.value = el.classList.value.replace('ButtonActive', 'Button');
			})
		} catch(err) { console.warn(err); }
	}
	//# Previous button click fix: END
	function creatingPanel()
	{
		allPicsSettings = funcs_.scanDirectory(command);
		if((document.getElementById(elementNames.CPFSP_panelID) && command != 'refresh')) { return } // Will repeat if command == refresh
		emojisPanel.innerHTML = ''; // Clear panel
		emojisPanel.setAttribute('id', elementNames.CPFSP_panelID); // Change panel ID
		emojisPanel.removeAttribute('class'); // Removes classes for avoid styles problems
		buttonCPFSP.classList.add(elementNames.CPFSP_activeButton); // Add CSS for select
		funcs_.setStyleFilter(undefined, 'delete'); // Remove last filter
		/*let previousButton = document.getElementById(buttonCPFSP.getAttribute('from'));
		try
		{ // Unselecting previous button
			previousButton.classList.value = previousButton.classList.value.replace('ButtonActive', 'Button');
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
		buttonOpenFolder.innerText = open_folder_ ? labelsNames.btnOpenFolder : labelsNames.btnFolderPath;
		buttonOpenFolder.addEventListener('click', funcs_.openFolder);
		buttonsPanel.append(buttonOpenFolder);
		emojisPanel.insertBefore(buttonsPanel, emojisPanel.firstChild); // Adds button to panel
		// Adds checkbox for spoiler
		let SpoilerCheckbox = document.createElement('div');
		SpoilerCheckbox.setAttribute('id', elementNames.spoilerCheckbox);
		SpoilerCheckbox.setAttribute('title', labelsNames.spoilerTooltip);
		SpoilerCheckbox.innerHTML = `<input type="checkbox"></input><p>${labelsNames.spoilerCheckbox}</p>`;
		buttonsPanel.append(SpoilerCheckbox);
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
		async function setImagesSRC(newPicture, elementCol, file)
		{
			try
			{
				if(file.link.includes('file:///'))
				{
					async function loadImagesSRC(newPicture)
					{ // Convert local file to base64 for preview
						let filePath = newPicture.getAttribute('path').replace('file:///', ''); // both "path" attribute and "file.link" variable contains "file:///path..."
						funcs_.readLocalFileAsync(filePath, 'base64') // Async creating base64 data
						.then(data => { newPicture.setAttribute('src', `data:image/${path_.extname(filePath).slice(1)};base64,${data}`); })
						.catch(err => { console.warn(err); newPicture.setAttribute('src', NotFoundIMG); });
					}

					let emojisPanel = document.querySelector(searchNames.emojisPanel);
					var GodForgiveMeObserver = new IntersectionObserver((entries) =>
					{ // I was very tired and couldn't think of a better solution
						entries.forEach((entry) =>
						{
							// If user not see this element on screen
							if(!entry.isIntersecting) { return elementCol.removeAttribute('waitload'); }

							elementCol.setAttribute('waitload', '');
							loadImagesSRC(newPicture);
							GodForgiveMeObserver.disconnect();
						});
					}, { root: emojisPanel });
					GodForgiveMeObserver.observe(newPicture);
				}
				else { newPicture.setAttribute('src', file.link); }
			} catch(err) { newPicture.setAttribute('src', NotFoundIMG); console.error(err); }
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

			elementCol.setAttribute('waitload', ''); // for CSS loading animation, after img loads it will delete this attribute
			setImagesSRC(newPicture, elementCol, file);

			newPicture.setAttribute('aria-label', file.name);
			newPicture.setAttribute('alt', file.name);
			newPicture.setAttribute('title', file.name); // For displaying pictures name
			newPicture.setAttribute('class', elementNames.newPicture);
			newPicture.setAttribute('onload', `this.removeAttribute('onload'); this.parentNode.removeAttribute('waitload');`); // Delete onload attribute and indicate about load for li (parentNode)
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
	// Creating subpanel for image resizing
	function createScaleSubpanel()
	{
		if(document.getElementById(elementNames.CPFSP_scalePanelID)) { return }

		let scaleSubpanel = document.createElement('div');
		scaleSubpanel.setAttribute('id', elementNames.CPFSP_scalePanelID);

		let subpanelInput = document.createElement('input');
		subpanelInput.setAttribute('placeholder', labelsNames.intNumber);
		subpanelInput.value = Configuration.ScaleSizeForPictures.Value.num;
		subpanelInput.addEventListener('change', ()=>funcs_.SSFPFunc.validateNum(subpanelInput.value, scaleSubpanel));

		scaleSubpanel.append(subpanelInput);
		scaleSubpanel.append(funcs_.SSFPFunc.createSelect());

		let emojisPanel = document.getElementById(elementNames.CPFSP_panelID);
		emojisPanel.parentNode.append(scaleSubpanel);
	}
	creatingPanel();
	if(Configuration.ScaleSizeForPictures.Value.subpanel) { createScaleSubpanel(); }
	
}
funcs_.addPicturesPanelButton = (emojisGUI) =>
{
	if(!emojisGUI) { return } // I know that in Discord there is no "s"
	// let emojiButton = document.querySelector('button[class*="emojiButton"]'); // Emojis button in chat
	let emojisMenu = emojisGUI.querySelector(searchNames.emojisGUI);
	if(!emojisMenu) { return }
	if(document.getElementById(elementNames.CPFSP_buttonGoID)) { return }

	let buttonCPFSP = document.createElement('div'); // Discord not using button tag for buttons anymore
	buttonCPFSP.innerText = labelsNames.Pictures;
	buttonCPFSP.setAttribute('id', elementNames.CPFSP_buttonGoID);
	let buttonClass = emojisMenu.querySelector('div[class*="navButton_"]').classList.value.replace('ButtonActive', 'Button'); // Copy class from other button in this menu
	buttonCPFSP.setAttribute('class', buttonClass);
	buttonCPFSP.removeEventListener('click', funcs_.moveToPicturesPanel); // Insurance
	buttonCPFSP.addEventListener('click', funcs_.moveToPicturesPanel);
	emojisMenu.append(buttonCPFSP);
}
// Functions for ScaleSizeForPictures setting
funcs_.SSFPFunc = {};
funcs_.SSFPFunc.validateNum = (text, el) =>
{
	text = Number(text);
	if(9999 < text)
	{ // Against freezes
		text = 9999;
		setTimeout(()=>{ el.querySelector('input').value = 9999}, 200);
		funcs_.showAlert(labelsNames.Yamete, labelsNames.tooBig);
	}
	if(!Number.isInteger(text) || text <= 0)
	{
		setTimeout(()=>{ el.querySelector('input').value = ''}, 200);
		Configuration.ScaleSizeForPictures.Value.num = '';
	}
	else { Configuration.ScaleSizeForPictures.Value.num = Math.abs(Math.round(text)); }
	funcs_.saveConfiguration();
	return true;
}
funcs_.SSFPFunc.createSelect = () =>
{
	let selectList = document.createElement('select');
	selectList.setAttribute('id', elementNames.Config_scaleType);
	let isWidth = (Configuration.ScaleSizeForPictures.Value.type == 'width');
	let isHeight = (Configuration.ScaleSizeForPictures.Value.type == 'height');
	selectList.add(new Option(labelsNames.width, 'width', isWidth, isWidth));
	selectList.add(new Option(labelsNames.height, 'height', isHeight, isHeight));
	selectList.addEventListener('change', (e)=>funcs_.setConfigValue(e, 'ScaleSizeForPictures', document.getElementById(elementNames.Config_scaleType).value, 'type'));

	return selectList;
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
	if(!_link) { return }
	let _path = decodeURI(from.target.getAttribute('path').replace('file:///', '')); // I know this stupid, but file:/// I need for features, maybe..? Well
	let _name = from.target.getAttribute('alt');
	let _bufferFile = null;
	let isWebFile = _link.indexOf(';base64,') != -1 ? false : true;
	let isLocalFile = !isWebFile;
	let asSpoiler = document.querySelector(`#${elementNames.spoilerCheckbox} input`).checked;
	// Old is DiscordAPI.currentChannel.id; or if from other library: BDFDB.ChannelUtils.getSelected().id
	let channelID = window.location.pathname.split('/').pop(); // When thread is open in a separate window it is considered as current location
	if(!getDiscordTextarea()) { return } // Stop method if user doesn't have chatbox
	// "DiscordSelectors.Textarea.textArea.value" stopped working
	let ChatBox = getDiscordTextarea().querySelector('div[role*="textbox"]') ? getDiscordTextarea().querySelector('div[role*="textbox"]') : getDiscordTextarea().querySelector('textarea'); // User's textbox. 'div[role*="textbox"]' for modern textarea; tag 'textarea' fore old textarea
	let ChatBoxText = ChatBox.innerText ? ChatBox.innerText : ChatBox.value ? ChatBox.value : '';

	// Sending text
	if(!Configuration.SendTextWithFile.Value) { ChatBoxText = null; }
	else
	{
		if(ChatBoxText.replace(/\s/g, '').length <= 0) { ChatBoxText = null; }
		else if(ChatBoxText.length > 2001) // 2001 is limit for text length
		{ // +-return for interrupt action; or BdApi.showConfirmationModal
			ChatBoxText = null;
			funcs_.showAlert(labelsNames.forYou, labelsNames.symbolsLimit);
		}
	}

	function sendLocalFile(_bufferFile)
	{
		_bufferFile = _bufferFile ? _bufferFile : funcs_.readLocalFile(_path, "base64", true);
		if(asSpoiler)
		{ // Making spoiler from text using stupid way
			_name = "SPOILER_"+_name;
		}
		let _fileNew = new File([_bufferFile], _name);

		// Prevents sending files larger than 10 MB if the corresponding option is enabled
		if(Configuration.SizeLimitForFile.Value && (_fileNew.size > (10*1024*1024))) { return funcs_.showAlert(labelsNames.forYou, labelsNames.filesizeLimit); };
		let replyIDs = funcs_.getCurrentReply();
		funcs_.closeCurrentReply();
		messageModule(channelID, ChatBoxText, replyIDs, _file = _fileNew); // add ", {content:'new with file'}" for adding text

		_fileNew = null;
		lastSent = { file: _file, link: null };
	}

	if(Configuration.AutoClosePanel.Value)
	{
		if(document.getElementById(elementNames.CPFSP_buttonGoID) && !from.shiftKey)
		{ // Below code will run if panel is displayed && click without shift key
			let clickEvent = ChatBox.ownerDocument.createEvent('MouseEvents');
			clickEvent.initMouseEvent("mousedown", true, true, ChatBox.ownerDocument.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null); // Thanks stackoverflow.com ;)
			ChatBox.dispatchEvent(clickEvent);
		}
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
				let _FileU8Array = BufferFromFormat_(_link.split(';base64,')[1], 'base64');
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
							sendLocalFile(DisBlob);
							DisCanvas = null, DisIMG = null, DisBlob = null;
						})
					}, _dataType, 1);
					return // End method after sending resized picture
				}
				if(Configuration.ScaleSizeForPictures.Value.exp && _fileType == 'gif')
				{ // Special support for format
					(async () =>
					{
						let _bufferFile = await funcs_.resizeGif(_path, newWidth, newHeight, _name);
						sendLocalFile(_bufferFile);
					})();
					return
				}
			}
		}
	}
	if(isLocalFile)
	{ // Sending local picture
		sendLocalFile(_bufferFile);
		return
	}
	if(asSpoiler)
	{  // Making spoiler from text using stupid way
		_link = "||"+_link+"||";
	}
	/* // DEPRECATED (c)0.0.1 version //
	_link = (escape(ChatBoxText) == "%uFEFF%0A") ? _link : `\n${_link}`; // "%uFEFF%0A" is empty chat value for Discord
	ComponentDispatchModule.dispatchToLastSubscribed(DiscordModules.DiscordConstants.ComponentActions.INSERT_TEXT, {
		content: `${_link}`
	}); // Adds text to user's textbox
	*/
	lastSent = { file: null, link: _link}; // For Last Sent option
	if(Configuration.SetLinkParameters.Value.length) { _link = (_link+Configuration.SetLinkParameters.Value); } // Adds user additional parameters
	let replyIDs = funcs_.getCurrentReply();
	funcs_.closeCurrentReply();
	if(ChatBoxText) { messageModule(channelID, ChatBoxText, replyIDs); }
	// Sending link of picture
	return messageModule(channelID, _link, replyIDs);
}
funcs_.RepeatLastSentFunc = (event) =>
{
	if(!Configuration.RepeatLastSent.Value) { return }
	if(!event.altKey || event.which != 86) { return } // 86 is V key, 18 is Alt
	if(funcs_.IsPressed_KeyWhich(86)) { return } // Will return if V not released
	if(!lastSent) { return }
	if(!lastSent.file && !lastSent.link) { return }
	let channelID = window.location.pathname.split('/').pop(); // Old is DiscordAPI.currentChannel.id;

	let replyIDs = funcs_.getCurrentReply();
	funcs_.closeCurrentReply();
	if(lastSent.file)
	{
		messageModule(channelID, undefined, replyIDs, lastSent.file); //Repeat sent file without a text from the textbox
	}
	else if(lastSent.link)
	{
		messageModule(channelID, lastSent.link, replyIDs);
	}
}
funcs_.createSentFiles = (event) =>
{
	console.log(event.file)
	/* let filePath, fileData;
	try { fs_.writeFileSync(filePath+sentType, JSON.stringify(fileData)); }
	catch(err) { console.warn(`There has been an error saving your ${sentType} file:`, err.message); }*/
}
funcs_.IsPressed_KeyWhich = (keyWhich) =>
{ // Check pressed keys and detect when it release. It uses Which for supporting different language
	if(!tempVars_) { console.warn('Error with keeping temp variable!'); return false }
	if(tempVars_['IsPressed_'+'KeyWhich_'+keyWhich]) { return true }

	tempVars_['IsPressed_'+'KeyWhich_'+keyWhich] = true;
	let detectKeyRelease = (event) =>
	{
		if(event.which != keyWhich) { return document.body.addEventListener('keyup', detectKeyRelease, { once: true }); }
		try { tempVars_['IsPressed_'+'KeyWhich_'+keyWhich] = false; }
		catch(err) { return console.warn('Error with keeping temp variable!', err); }
	}
	document.body.addEventListener('keyup', detectKeyRelease, { once: true });
	return false
}
funcs_.DiscordMenuObserver = new MutationObserver((mutations) =>
{ // To find "emoji-picker-tab-panel" and "gif-picker-tab-panel" and "wrapper-OxgYJ1" (sticker panel) exist
	mutations.forEach((mutation) =>
	{
		if(!mutation.target.parentNode) { return }
		if(!mutation.target.parentNode.parentNode) { return }
		if(!mutation.target.parentNode.parentNode.parentNode) { return }
		if(!document.querySelector(searchNames.emojisClassGUI)) { return }
		funcs_.addPicturesPanelButton(document.querySelector(searchNames.emojisClassGUI)); // contentWrapper
	});
})

class CustomPanelForSendingPictures
{
	constructor(meta)
	{
		this.meta = meta;
		this.api = new PluginApi_(this.meta.name);
	}
//-----------| Load Info. Kinda optional now |-----------//
	getName() { return this.meta.name; }
	getAuthor() { return this.meta.author; }
	getVersion() { return this.meta.version; }
	getDescription() { return this.meta.description; }
	getUpdateURL() { return this.meta.updateUrl; }

//-----------| Default Methods |-----------//
	start()
	{
		try
		{
			if(!funcs_) { return console.warn('There is error with functions declaration'); }
			funcs_.versionCheck(this);
			funcs_.loadConfiguration();
			funcs_.loadSettings(); // despite the fact that the same method is called in the directory scan - the plugin has an option to turn off automatic scan, so doesn't remove this
			funcs_.setStyles();
			console.log(config.info.name, 'loaded');
			funcs_.warnsCheck();
			funcs_.updateCheck(this);

			funcs_.scanDirectory();
			funcs_.DiscordMenuObserver.observe(document.body, { subtree: true, childList: true });
			//DiscordModules.Dispatcher.subscribe(DiscordModules.DiscordConstants.ActionTypes.UPLOAD_COMPLETE, createSentFiles);
		} catch(err) { console.warn('There is error with starting plugin:', err); }
	}

	stop()
	{
		try
		{
			funcs_.DiscordMenuObserver.disconnect();
			//DiscordModules.Dispatcher.unsubscribe(DiscordModules.DiscordConstants.ActionTypes.UPLOAD_COMPLETE, createSentFiles);
			funcs_.setStyles('delete');
			funcs_.setStyleFilter(undefined, 'delete');
			document.body.removeEventListener('keydown', funcs_.RepeatLastSentFunc);
			//funcs_ = null;
			console.log(config.info.name, 'stopped');
			//PluginApi_.Patcher.unpatchAll();
		} catch(err) { console.warn('There is error with stoping plugin:', err); }
	}

	getSettingsPanel()
	{
		var PanelElements = {};
		const _additionalInit = () =>
		{
			function _ScaleSizeForPictures(elementContainer)
			{
				if(!elementContainer || document.getElementById(elementNames.Config_scaleType)) { return }
				let newDiv = document.createElement('div');
				// List with width or height setting
				newDiv.append(funcs_.SSFPFunc.createSelect());
				// List with experimental setting
				function createOptionCheckbox(option_name, option_param, el_name, el_label)
				{
					let specialOptionDiv = document.createElement('div');
					specialOptionDiv.setAttribute('id', el_name);
					let isChecked = Configuration[option_name]["Value"][option_param] ? 'checked' : '';
					specialOptionDiv.innerHTML = `<text>${el_label}: </text><input type='checkbox' ${isChecked}>`;
					specialOptionDiv.querySelector('input').addEventListener('change', (e)=>funcs_.setConfigValue(e, option_name, document.querySelector(`#${el_name} input`).checked, option_param));
					newDiv.append(specialOptionDiv);
				}
				createOptionCheckbox('ScaleSizeForPictures', 'subpanel', elementNames.Config_scaleSubpanel, labelsNames.scaleSubpanel);
				createOptionCheckbox('ScaleSizeForPictures', 'exp', elementNames.Config_scaleExp, labelsNames.scaleExperimental);
				elementContainer.insertBefore(newDiv, elementContainer.lastChild);
			}
			// It's a really dumb way to do it, but I'm extremely tired
			setTimeout(()=>
			{
				PanelElements['self'] = document.querySelector('.bd-settings-group .bd-settings-container');
				PanelElements['ScaleSizeForPictures_container'] = PanelElements['self'].querySelector('label[for="ScaleSizeForPictures"]').parentNode;

				// Creating additional settings
				_ScaleSizeForPictures(PanelElements['ScaleSizeForPictures_container'].parentNode);
			}, 1500);
		}

		const _settings =
		[{
			type: "category",
			id: "CPFSP_Basic_Settings",
			name: labelsNames.configMenu,
			collapsible: false,
			shown: true,
			settings:
			[
				// Enables updates check
				{ type: "switch", id: "CheckForUpdates", name: Configuration.CheckForUpdates.Title, note: Configuration.CheckForUpdates.Description, value: Configuration.CheckForUpdates.Value },
				// Use Sent Links
				{ type: "switch", id: "UseSentLinks", name: Configuration.UseSentLinks.Title, note: Configuration.UseSentLinks.Description, value: Configuration.UseSentLinks.Value },
				// Send Text With File
				{ type: "switch", id: "SendTextWithFile", name: Configuration.SendTextWithFile.Title, note: Configuration.SendTextWithFile.Description, value: Configuration.SendTextWithFile.Value },
				// Only Forced Update
				{ type: "switch", id: "OnlyForcedUpdate", name: Configuration.OnlyForcedUpdate.Title, note: Configuration.OnlyForcedUpdate.Description, value: Configuration.OnlyForcedUpdate.Value },
				// sentType to srcType
				{ type: "switch", id: "sentType2srcType", name: Configuration.sentType2srcType.Title, note: Configuration.sentType2srcType.Description, value: Configuration.sentType2srcType.Value },
				// Repeat Last Sent
				{ type: "switch", id: "RepeatLastSent", name: Configuration.RepeatLastSent.Title, note: Configuration.RepeatLastSent.Description, value: Configuration.RepeatLastSent.Value },
				// Don't send local files if size more than 10 MB
				{ type: "switch", id: "SizeLimitForFile", name: Configuration.SizeLimitForFile.Title, note: Configuration.SizeLimitForFile.Description, value: Configuration.SizeLimitForFile.Value },
				// Auto Close Panel
				{ type: "switch", id: "AutoClosePanel", name: Configuration.AutoClosePanel.Title, note: Configuration.AutoClosePanel.Description, value: Configuration.AutoClosePanel.Value },
				// Sending File Cooldown
				{ type: "number", id: "SendingFileCooldown", name: Configuration.SendingFileCooldown.Title, note: Configuration.SendingFileCooldown.Description, value: Configuration.SendingFileCooldown.Value, min: 0, max: 600000, step: 1 },
				// Scale Size For Pictures
				{ type: "text", id: "ScaleSizeForPictures", name: Configuration.ScaleSizeForPictures.Title, note: Configuration.ScaleSizeForPictures.Description, value: Configuration.ScaleSizeForPictures.Value.num, placeholder: Configuration.ScaleSizeForPictures.Default },
				// Set Link Parameters
				{ type: "text", id: "SetLinkParameters", name: Configuration.SetLinkParameters.Title, note: Configuration.SetLinkParameters.Description, value: Configuration.SetLinkParameters.Value, placeholder: Configuration.SetLinkParameters.Default },
				// Main Folder Path
				{ type: "text", id: "mainFolderPath", name: Configuration.mainFolderPath.Title, note: Configuration.mainFolderPath.Description, value: Configuration.mainFolderPath.Value, placeholder: Configuration.mainFolderPath.Default },
				// Main Folder Name Display
				{ type: "text", id: "mainFolderNameDisplay", name: Configuration.mainFolderNameDisplay.Title, note: Configuration.mainFolderNameDisplay.Description, value: Configuration.mainFolderNameDisplay.Value, placeholder: Configuration.mainFolderNameDisplay.Default },
				// Section Text Color
				{ type: "color", id: "SectionTextColor", name: Configuration.SectionTextColor.Title, /*note: Configuration.SectionTextColor.Description,*/ value: Configuration.SectionTextColor.Value, colors: null, inline: true },
			],
		}]

		const _onChange = (category, id, value) =>
		{
			//console.log(category, id, value)

			// Do not allow writing by non-existing keys
			if(!Object.keys(Configuration).includes(id)) { return }

			if("SendingFileCooldown" === id)
			{
				value = Number(value);
				if(!Number.isInteger(value)) { Configuration.SendingFileCooldown.Value = Configuration.SendingFileCooldown.Default; funcs_.saveConfiguration(); return }
				Configuration.SendingFileCooldown.Value = value;
				funcs_.saveConfiguration();
				return
			}
			if("ScaleSizeForPictures" === id)
			{
				funcs_.SSFPFunc.validateNum(value, PanelElements['ScaleSizeForPictures_container']); // Validate and save value
				return
			}
			if("mainFolderPath" === id)
			{
				if(!value.length) { return }
				if(!fs_.existsSync(value)) { Configuration.mainFolderPath.Value = Configuration.mainFolderPath.Default; funcs_.saveConfiguration(); return }
				Configuration.mainFolderPath.Value = value;
				funcs_.saveConfiguration();
				return
			}
			if("mainFolderPath" === id)
			{
				if(!value.length) { return }
				Configuration.mainFolderPath.Value = value;
				funcs_.saveConfiguration();
				return
			}
			if("SectionTextColor" === id)
			{
				Configuration.SectionTextColor.Value = value;
				funcs_.saveConfiguration();
				funcs_.setStyles('delete');
				funcs_.setStyles();
				return
			}

			Configuration[id].Value = value;
			funcs_.saveConfiguration();
		};

		return BdApi.UI.buildSettingsPanel({
			settings: _settings,
			onChange: _onChange,
			getDrawerState: _additionalInit,
		});
	}
};

module.exports = CustomPanelForSendingPictures;