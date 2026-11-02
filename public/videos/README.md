# Hero video asset

Drop the final BaliWild hero video here as **`hero.mp4`**:

- 8–12 seconds, seamless loop
- 1920×1080 (or 2560×1440), H.264 MP4
- No vendor/partner logos, names, watermarks or identifiable third-party branding
- Target file size **under 3 MB**
- Mild motion only; avoid fast cuts that fight the headline
- Audio is never played (muted), but remove it to save bytes

Recommended ffmpeg encode:

```bash
ffmpeg -i source.mov \
  -t 10 -an \
  -vf "scale=1920:-2:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -profile:v high -preset slow -crf 24 -pix_fmt yuv420p \
  -movflags +faststart \
  public/videos/hero.mp4
```

The component (`src/components/features/HeroVideo.tsx`) only loads the video on
desktop after idle, and only when the guest allows motion and is not on
save-data/slow-network. Mobile always gets the still poster
(`/images/hero-bali.jpg`). Until `hero.mp4` exists, the poster is the hero.
