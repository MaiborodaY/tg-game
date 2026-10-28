# World of Connections intro mark

`woc-handshake-source.png` is the unchanged user-supplied 1254 × 1254 transparent
PNG, copied on 2026-09-19 from:

`C:/TG_bot/tg-game/.worktrees/brotd-calm-talents/king-defense-toon/promo/world-of-connections/woc-handshake.png`

No new drawing, lettering or colour treatment was applied. The runtime export
only trims transparent padding, scales to twice the maximum displayed width and
encodes WebP with alpha: `assets/branding/woc-handshake.webp`, 144 × 103, 8,232 bytes.

Repeatable export from the repository root with the existing `sharp` dependency:

```powershell
node --input-type=module -e "import sharp from 'sharp'; await sharp('king-defense-toon/art/branding/woc-handshake-source.png').trim().resize({width:144,kernel:'lanczos3'}).webp({quality:88,effort:6}).toFile('king-defense-toon/assets/branding/woc-handshake.webp');"
```

The intro lazily loads this small image with its movie and reuses the same image
element. It is displayed separately from the MP4 at 64–72 CSS pixels, bottom left,
with safe-area padding. Skip stays bottom right. Branding is noninteractive and
does not gate playback. Reduced-motion entry requests neither intro asset.
