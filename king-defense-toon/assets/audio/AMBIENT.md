# Level 1 ambient music

The first-level playlist alternates `ambient-level-1.mp3` and `ambient-level-1-menu.mp3`, then repeats. Both are full user-provided tracks compressed for the browser game. No cuts, rearrangement or generated audio were added. The original WAVs remain unchanged outside the repository and are not shipped. Only the second export has a constant gain adjustment, described below.

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

## Second track: Menu / Ambient 2

- Source: `C:\Unity\Unity Projects\Bro TD\Assets\Sounds\Music\Menu\Ambient 2.wav`.
- Source size: **21,040,166 bytes**; stereo, 44,100 Hz, signed 16-bit PCM WAV.
- Source duration: **119.249977 seconds** (5,258,924 samples per channel).
- Source SHA-256: `f84a384bbd51c221a4b64c073d2a081fb01200c131991c80eea56b5c794ba67e`.
- Provenance: supplied locally by the project owner, like the first track.
- Browser file: `ambient-level-1-menu.mp3`, **1,431,972 bytes**, **93.1941% smaller**.
- Codec: libmp3lame / FFmpeg 7.1, **96 kbps CBR**, stereo, 44,100 Hz.
- Browser SHA-256: `e462983594afee6368f35ee71a64e2f1220fe8ed4ac615a6d38c0801494ea006`.
- Loudness measured with FFmpeg `ebur128=peak=true`: source **-38.4 LUFS**, first shipped track **-27.3 LUFS**. A constant **+11.5 dB** export gain produces **-27.4 LUFS**, **-9.4 dBFS true peak**, with the same **12.1 LU** loudness range. No limiter or dynamic compressor is used.
- Full decode succeeds. FFmpeg reports 5,258,927 decoded samples per channel: three extra padding samples (**0.068 ms**), with no source duration cut. The encoder emits a terminal `Trying to remove 1152 samples, but the queue is empty` warning; decoded sample count, full-file decoding and browser playback were checked explicitly.

```powershell
& ffmpeg -hide_banner -y -i 'C:\Unity\Unity Projects\Bro TD\Assets\Sounds\Music\Menu\Ambient 2.wav' -map 0:a:0 -map_metadata -1 -vn -af volume=11.5dB -c:a libmp3lame -b:a 96k -ar 44100 -ac 2 -write_xing 1 -id3v2_version 3 'assets/audio/ambient-level-1-menu.mp3'
```

The playlist totals **3,208,760 bytes** and about **4 min 27 sec**. One media element streams the current track through the existing gain node. The second track is not requested until the first ends. No extra audio context, decoded full-track buffer, preload of both tracks, timer or per-frame audio work is added. Normal loading may introduce a short gap between tracks; this is not a crossfade system. MP3 is lossy, so objective decoding/loudness checks do not establish perceptual identity with the WAV. Encoding options: [FFmpeg libmp3lame documentation](https://www.ffmpeg.org/ffmpeg-codecs.html#libmp3lame-1).
