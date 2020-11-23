import os
import sys
from PIL import Image
import base64
from io import BytesIO
import io

''' Required for .gif resizing in CustomPanelForSendingPictures.js '''
args = sys.argv
args = args[1:] # First element of args is the file name
if len(args) < 3:
	print('You have not passed commands! Start parameters: inputFile width height')
else:
	durs = []
	trnsprn = []
	i = 0
	img = Image.open(args[0])
	frames = []
	try:
		while (True):
			img.seek(i)
			frame = Image.new('RGBA', img.size)
			frame.paste(img, (0,0), img.convert('RGBA'))
			durs.append(img.convert('RGBA').info['duration'])
			try:
				trnsprn.append(img.info['transparency'])
			except:
				trnsprn.append(255)
			frame.thumbnail((int(args[1]),int(args[2])))
			frame.info = img.info
			frames.append(frame)
			i += 1
	except EOFError:
		pass
		buffer = BytesIO()
		frames[0].save(buffer,format="GIF", save_all = True,append_images = frames[1:] ,disposal = 2, loop = 0, transparency=trnsprn[0], optimize=False, duration=durs)
		#frames[0].save("Output.gif", save_all = True,append_images = frames[1:] ,disposal = 2, loop = 0, transparency=trnsprn[0], optimize=False, duration=durs)
		print("data:image/gif;base64," + base64.b64encode(buffer.getvalue()).decode())
exit()

'''In Discord plugin: child_process_.execSync(`python "${picturesPath}ResizeGif.py" "${_path}" ${newWidth} ${newHeight}`)'''