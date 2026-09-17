# Level 1 ambient music

`ambient-level-1.mp3` is the full user-provided track, compressed for the browser game. No cuts, rearrangement, normalization, or generated audio were added. The original WAV remains unchanged outside the repository and is not shipped with the game.

## Source

- Path: `C:\Unity\Unity Projects\Bro TD\Assets\Sounds\Music\Ambient 1.wav`
- Size: **26,107,930 bytes**.
- Format: stereo, 44,100 Hz, signed 16-bit PCM WAV.
- Duration: **147.999977 seconds** (6,526,799 samples per channel).
- SHA-256: `ada106d03f16f72c05840cf54a2f519eea1976ed6d43b2205fab97550cec97b3`.
- Provenance: supplied locally by the project owner. The asset's original license was not present in this task and has not been independently verified; no ownership or redistribution-license claim is made here.

## Browser asset

- File: `ambient-level-1.mp3`.
- Codec: MPEG Layer III, **96 kbps CBR**, stereo, 44,100 Hz, encoded with libmp3lame / FFmpeg 7.1.
- Size: **1,776,788 bytes** (1.78 MB), **93.19% smaller** than the source.
- SHA-256: `1acfb7f6045c158d0e1207c8f2720567683b1cf6393e23f90d4b99df064968f5`.
- Decoding with FFmpeg returns exactly the source's 6,526,799 samples per channel. The MP3 container reports 148.04 seconds including encoder padding; the Xing/LAME header preserves delay/padding information.
- Decoded peak: **−9.35 dBFS**; RMS: **−29.93 dBFS**. The source peak is −8.88 dBFS and RMS is −29.48 dBFS. No clipping or gain increase was introduced.
- The first and last 100 ms are already quiet. Decoded peaks in those windows are approximately −52.8 and −69.2 dBFS respectively. The whole track is suitable for a quiet repeat without trimming, though exact gapless behavior depends on the browser's media decoder.

96 kbps keeps the full stereo ambience at a modest download size. Playback volume and looping are controlled by the game, not baked into the file.

## Reproduce

The encoder was provided by `imageio-ffmpeg==0.6.0` in a temporary tool directory. It was not added to game dependencies. Run from `king-defense-toon`, substituting an available FFmpeg executable:

```powershell
& ffmpeg -hide_banner -y -i 'C:\Unity\Unity Projects\Bro TD\Assets\Sounds\Music\Ambient 1.wav' -map 0:a:0 -map_metadata -1 -vn -c:a libmp3lame -b:a 96k -ar 44100 -ac 2 -write_xing 1 -id3v2_version 3 'assets/audio/ambient-level-1.mp3'
```

Verification used FFmpeg `volumedetect`, float PCM decoding, exact sample counts, and SHA-256 hashes. No battle simulation was involved.
