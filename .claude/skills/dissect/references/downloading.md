# Downloading: platform notes

`dissect.py` tries three times before giving up:

1. the yt-dlp that came with the script's dependencies (or the one on PATH)
2. the same, with `--impersonate chrome` (curl_cffi makes the request look like a real browser)
3. the newest yt-dlp release fetched fresh (`uvx --refresh yt-dlp@latest`, or pip into `~/.cache/dissect`), also with impersonation

It never reads browser cookies unless `--cookies-from-browser` is passed, and you only pass that after the user says yes for that download.

## Exit codes and `status`

| Exit | `status` | Meaning | What to do |
|---|---|---|---|
| 0 | `ok` | Done | Carry on with Step 2 |
| 1 | `bad_input`, `missing_tool`, `unreadable_file`, `missing_dependency` | Not a link or file, ffmpeg missing, file broken | Run `scripts/doctor.py`; check the path |
| 2 | `unsupported_url` | yt-dlp has no extractor for the link | Ask for the direct post URL, or a file |
| 2 | `unavailable` | Removed, private, region-locked | Check in a browser |
| 2 | `blocked` | 403, captcha, bot wall even after impersonation | Ask for a file the user downloaded |
| 2 | `network` | Timeouts, DNS, TLS | Check the connection, retry later |
| 2 | `download_failed` | Anything else | Ask for a file |
| 3 | `login_required` | Login wall, age gate, "confirm you're not a bot" | Ask, then `--cookies-from-browser <browser>` |

The `detail` field carries the last lines of yt-dlp's error from each attempt.

## Asking for cookies

Ask in plain words and name the browser, for example:

> This reel only downloads when you're logged in. May I let yt-dlp read your Chrome cookies for this one download?

Only after a clear yes, rerun with `--cookies-from-browser chrome` (also: `firefox`, `safari`, `edge`, `brave`, `chromium`, `opera`, `vivaldi`). Notes:
- macOS shows a keychain prompt for Chromium browsers; that's normal. Safari needs Full Disk Access for the terminal.
- Windows: Chrome must be closed, since it locks its cookie database.
- Linux: Chromium browsers may need the keyring unlocked.
- A profile other than the default: `--cookies-from-browser "chrome:Profile 1"`.
- The cookies are used for that one run and never written to the dissection folder.

## Platforms

**YouTube (videos and Shorts).** Usually works without login. Gives views, likes, comments, followers, chapters, tags, and the most-replayed heatmap (only on videos with enough views; Shorts rarely have one). "Sign in to confirm you're not a bot" comes from data-centre IPs and heavy use; impersonation or the newest yt-dlp often fixes it, otherwise cookies do. Age-restricted and members-only videos need cookies.

**TikTok.** Usually works. Gives views, likes, comments, shares (`reposts`). Follower counts are often missing. Photo carousels (slideshows) aren't videos; ask for a different link. Region blocks happen; a file from the user works.

**Instagram Reels.** Often needs login, especially from servers or after several downloads. Likes may be hidden by the creator; views often missing. Use the `/reel/<id>/` link, not a profile link.

**X / Twitter.** Public posts usually work; sensitive-media posts and some accounts need login. Use the status link (`/status/<id>`). Quote posts with several videos: the first video is taken (`--no-playlist`).

**Facebook.** Public videos and reels mostly work; group and friends-only posts need login. Share links (`fb.watch`, `/share/r/`) usually resolve.

**Vimeo.** Public videos work. Private links need the full link with its hash; showcase or password-protected videos need a file.

**Reddit.** `v.redd.it` and post links work; audio is a separate stream that yt-dlp merges (needs ffmpeg).

**LinkedIn, Snapchat Spotlight, Twitch clips, Bilibili, Dailymotion, Pinterest, Threads, Bluesky** and about 1,800 other sites: yt-dlp supports most of them; stats vary.

**Anything else** (a course platform, a DRM-protected stream, Netflix and similar): don't try to get around the protection. Ask the user for a file they're allowed to use.

## Long videos

`--max-minutes N` asks yt-dlp for only the first N minutes (`--download-sections`) and limits the analysis to them. For a 1-hour video, `--max-minutes 5` with `standard` takes a few minutes instead of half an hour.

## Local files

Any file ffmpeg reads works: mp4, mov, mkv, webm, even audio-only files (then there are no sheets). Platform stats are missing for local files; if the user knows the numbers, add them to the blueprint by hand.
