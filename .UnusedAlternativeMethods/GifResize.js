const gifResize = require('@gumlet/gif-resize');
const fs = require("fs");
const path = require("path");

/* Required for .gif resizing in CustomPanelForSendingPictures.js */
/* Uses following modules: @gumlet, bin-wrapper, cross-spawn, end-of-stream, execa, get-stream, gifsicle, human-signals, import-lazy, is-gif, is-stream, isexe, merge-stream. mimic-fn, npm-run-path, once, onetime, path-key, pump, shebang-command, shebang-regex, signal-exit, strip-final-newline, which, wrappy */
/* For compile: pkg -t node8.17.0-win-x86,node8.17.0-macos-x64,node8.17.0-linux-x64 "GifResize.js" */

var arguments = process.argv; // Get commands line arguments
if(arguments.length < 5) { console.warn('You have not passed commands! Start parameters: inputFile width height'); return process.exit(); }
var inputFile = arguments[2];
var Width = Number(arguments[3]);
var Height = Number(arguments[4]);
var Command = arguments[5] ? arguments[5].toLowerCase() : 'log';

if(!Number.isInteger(Width) || !Number.isInteger(Height)) { console.warn(`Width and Height should be integers!`); return process.exit(); }
if(path.extname(inputFile).toLowerCase() != '.gif') { console.warn(`Input file should be gif!`); return process.exit(); }
if(!fs.existsSync(inputFile)) { console.warn(`File doesn't exist!`); return process.exit(); }

const Buff = fs.readFileSync(inputFile); // Read file
const fileOutput = 'CustomPanelForSendingPictures[!fileOutput!]'; // Output file name
gifResize({
	width: Width,
	height: Height
})(Buff)
.then(data => { // In log case received message need be read from utf-8
	if('File'.toLowerCase() == Command) { fs.writeFileSync(`${fileOutput}.gif`, data); }
	if('JSON'.toLowerCase() == Command) { fs.writeFileSync(`${fileOutput}.json`, `"data:image/gif;base64,${data.toString('base64')}"`); }
	if('Log'.toLowerCase() == Command) { console.log(`data:image/gif;base64,${data.toString('base64')}`); }
})
.catch((err) => { console.warn(err); return process.exit(); })
.finally((err) => { return process.exit(); });