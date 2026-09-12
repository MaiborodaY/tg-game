"""Prepare approved companion sheets; no runtime or gameplay changes."""
from pathlib import Path
from PIL import Image, ImageFilter
import json
import shutil
from collections import deque

def components(mask):
    w,h = mask.size
    data = bytearray(mask.tobytes())
    for start in range(w*h):
        if not data[start]: continue
        data[start] = 0
        q = deque([start]); group = []
        while q:
            p = q.popleft(); group.append(p)
            x,y = p%w,p//w
            for n in ((p-1 if x else -1),(p+1 if x+1<w else -1),p-w,p+w):
                if 0<=n<w*h and data[n]:
                    data[n]=0; q.append(n)
        yield group

ROOT = Path(__file__).parent
SOURCE = Path(r'C:\Users\Waldiris\.codex\generated_images\01a08b5b-f39b-7f73-bfd3-4ebdb37d85d0')
SHEETS = {
    'archer': 'exec-343dbb5c-8179-447b-92d6-fb8825f1babb.png',
    'druid': 'exec-b6578188-0df0-4b47-86ac-862d85f3ba59.png',
    'turtle': 'exec-f8469b33-0de5-4dd2-822f-5ccdd02f17f2.png',
}

def cutout(im):
    im = im.convert('RGBA')
    # The baked checker is neutral, bright grey; artwork is coloured or dark.
    mask = Image.new('L', im.size)
    mask.putdata([255 if min(r,g,b) > 170 and max(r,g,b)-min(r,g,b) < 16 else 0
                  for r,g,b,a in im.getdata()])
    # Keep small enclosed whites (eyes and highlights), remove checker regions.
    values = bytearray(mask.tobytes())
    for group in components(mask):
        if len(group)<1000:
            for p in group: values[p]=0
    mask.frombytes(bytes(values))
    # Expand only into neutral edge pixels to suppress grey antialias fringes.
    edge = mask.filter(ImageFilter.MaxFilter(3))
    out = []
    for (r,g,b,a), bg, near in zip(im.getdata(), mask.getdata(), edge.getdata()):
        if bg:
            out.append((0,0,0,0))
        elif near and max(r,g,b)-min(r,g,b) < 20 and min(r,g,b) > 85:
            out.append((r,g,b, max(0, min(255, round((170-min(r,g,b))*3)))))
        else:
            out.append((r,g,b,255))
    im.putdata(out)
    return im

meta = {'frameSize': 256, 'anchor': [128,240], 'actions': {'idle':[0,1,2,3], 'walk':[4,5,6,7], 'action':[8,9,10,11]}, 'characters': {}}
for name, file in SHEETS.items():
    original = ROOT / (name + '-source.png')
    if not original.exists():
        shutil.copyfile(SOURCE / file, original)
    im = cutout(Image.open(original))
    # Extract complete connected figures BEFORE assigning animation slots.
    # Generated poses cross nominal cell lines (shoulders, bows, staves).
    groups = [g for g in components(im.getchannel('A').point(lambda a:255 if a>80 else 0)) if len(g)>10000]
    assert len(groups) == 12, (name, 'Expected twelve separate complete figures', len(groups))
    frames = [None]*12
    for group in groups:
        xs = [p%im.width for p in group]
        ys = [p//im.width for p in group]
        box = (min(xs), min(ys), max(xs)+1, max(ys)+1)
        col = min(3,int((box[0]+box[2])/2/(im.width/4)))
        row = min(2,int((box[1]+box[3])/2/(im.height/3)))
        i = row*4+col
        assert frames[i] is None, (name, 'Duplicate slot',i)
        left,top = max(0,box[0]-3),max(0,box[1]-3)
        right,bottom = min(im.width,box[2]+3),min(im.height,box[3]+3)
        frame = im.crop((left,top,right,bottom))
        support = Image.new('L',frame.size)
        values = bytearray(frame.width*frame.height)
        for p in group:
            values[(p//im.width-top)*frame.width+p%im.width-left]=255
        support.frombytes(bytes(values))
        support = support.filter(ImageFilter.MaxFilter(3))
        from PIL import ImageChops
        frame.putalpha(ImageChops.multiply(frame.getchannel('A'),support))
        # Stable cell/body anchor; weapon extent must not recenter the sprite.
        pivot_x = (col+0.5)*im.width/4-left
        frames[i] = (frame,pivot_x,frame.getbbox()[3])
    # These source frames have a staff clipped at the right sheet boundary.
    if name == 'druid':
        frames[3] = frames[0]
        frames[7] = frames[5]
    # One scale for the whole character, never independently fit each frame.
    scale = min(0.57, min(min(225/max(1,baseline-frame.getbbox()[1]), 116/max(1,x-frame.getbbox()[0]), 116/max(1,frame.getbbox()[2]-x)) for frame,x,baseline in frames))
    atlas = Image.new('RGBA',(1024,768))
    outdir = ROOT / name
    outdir.mkdir(exist_ok=True)
    for i,(frame,x,baseline) in enumerate(frames):
        resized = frame.resize((round(frame.width*scale),round(frame.height*scale)),Image.Resampling.LANCZOS)
        dest = Image.new('RGBA',(256,256))
        dest.alpha_composite(resized,(round(128-x*scale),round(240-baseline*scale)))
        bounds = dest.getchannel('A').point(lambda a:255 if a>8 else 0).getbbox()
        assert bounds and bounds[0]>=8 and bounds[1]>=8 and bounds[2]<=248 and bounds[3]<=248, (name,i,bounds)
        dest.save(outdir / f'{i+1:02}.png')
        atlas.alpha_composite(dest,((i%4)*256,(i//4)*256))
    atlas.save(ROOT / f'{name}.webp',quality=90,method=6)
    meta['characters'][name] = {'atlas': f'{name}.webp','scale':scale}
(ROOT/'frames.json').write_text(json.dumps(meta,indent=2)+'\n')
print('Prepared 36 RGBA frames and three WebP atlases with alpha.')
