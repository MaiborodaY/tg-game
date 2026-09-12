from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[2]
design=root/'design/dungeons';assets=root/'assets/dungeons'
# Shared cells and a fixed floor anchor; low-alpha generation padding is excluded.
for name in ('treasury','forge','mine'):
    im=Image.open(design/(name+'-source.png')).convert('RGBA')
    box=im.getchannel('A').point(lambda x:255 if x>=48 else 0).getbbox()
    im=im.crop(box);im.thumbnail((232,224),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',(256,256));out.alpha_composite(im,((256-im.width)//2,242-im.height))
    out.save(assets/(name+'.webp'),quality=90,method=6)
im=Image.open(design/'mount-source.png').convert('RGBA');cw=im.width//4
frames=[im.crop((i*cw,0,(i+1)*cw,im.height)) for i in range(4)]
boxes=[f.getchannel('A').point(lambda x:255 if x>=48 else 0).getbbox() for f in frames]
top=min(b[1] for b in boxes);bottom=max(b[3] for b in boxes)
scale=236/cw;size=(236,round((bottom-top)*scale))
out=Image.new('RGBA',(1024,256))
for i,frame in enumerate(frames):
    frame=frame.crop((0,top,cw,bottom)).resize(size,Image.Resampling.LANCZOS)
    out.alpha_composite(frame,(i*256+10,242-size[1]))
out.save(assets/'mount.webp',quality=90,method=6)
out.crop((0,0,256,256)).save(assets/'mount-icon.webp',quality=90,method=6)

im=Image.open(design/'banners-source.png')
for i,name in enumerate(('treasury','forge','mine')):
    row=im.crop((0,round(i*im.height/3),im.width,round((i+1)*im.height/3)))
    row.thumbnail((960,320),Image.Resampling.LANCZOS)
    row.save(assets/(name+'-banner.webp'),quality=86,method=6)

# The strip normalizer uses one scale for all eight poses. Keep that relationship
# here, match the shipped idle's height once, and anchor feet rather than the
# whole silhouette: an extended fist must not shift the body sideways.
animation_report={}
for name in ('treasury','forge','mine'):
    folder=design/(name+'-animation-frames')
    if not folder.exists():
        continue
    frames=[Image.open(folder/f'{i+1:02}.png').convert('RGBA') for i in range(8)]
    boxes=[f.getchannel('A').point(lambda x:255 if x>=48 else 0).getbbox() for f in frames]
    seed=Image.open(assets/(name+'.webp')).convert('RGBA')
    seed_box=seed.getchannel('A').point(lambda x:255 if x>=48 else 0).getbbox()
    scale=(seed_box[3]-seed_box[1])/(boxes[0][3]-boxes[0][1])
    anchor_x=192 if name=='mine' else 160
    atlas=Image.new('RGBA',(2560,320));preview=design/(name+'-animation-preview')
    preview.mkdir(exist_ok=True)
    metrics=[]
    for i,(frame,box) in enumerate(zip(frames,boxes)):
        sprite=frame.crop(box)
        # Include lifted crab legs, excluding the claw, so alternate steps do
        # not anchor the entire animal to whichever single toe is lowest.
        feet_left=round(sprite.width*.35) if name=='mine' else 0
        feet_top=round(sprite.height*(.72 if name=='mine' else .90))
        feet=sprite.getchannel('A').crop((feet_left,feet_top,sprite.width,sprite.height))
        feet_box=feet.point(lambda x:255 if x>=80 else 0).getbbox()
        anchor=feet_left+(feet_box[0]+feet_box[2])/2
        if name=='treasury' and i<4:
            # The chest stays above the torso while the walking legs spread.
            chest=sprite.getchannel('A').crop((0,0,sprite.width,round(sprite.height*.12)))
            chest_box=chest.point(lambda x:255 if x>=80 else 0).getbbox()
            chest_x=(chest_box[0]+chest_box[2])/2
            if i==0: chest_to_anchor=chest_x-anchor
            anchor=chest_x-chest_to_anchor
        size=(round(sprite.width*scale),round(sprite.height*scale))
        x,y=round(anchor_x-anchor*scale),304-size[1]
        assert x>=3 and y>=3 and x+size[0]<=317,(name,i,x,y,size)
        cell=Image.new('RGBA',(320,320));cell.alpha_composite(sprite.resize(size,Image.Resampling.LANCZOS),(x,y))
        cell.save(preview/f'{i+1:02}.png');atlas.alpha_composite(cell,(i*320,0))
        metrics.append({'width':size[0],'height':size[1],'left':x,'top':y,'floor':304})
    atlas.save(assets/(name+'-animation.webp'),quality=92,method=6)
    animation_report[name]={'scale':scale,'cell':320,'anchor':[anchor_x,304],'frames':metrics}
if animation_report:
    (design/'animation-build.json').write_text(json.dumps(animation_report,indent=2)+'\n',encoding='utf-8')
