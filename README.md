# Choice Champs

A read-aloud choice game for kids aged 3 to 6. Each story shows a real moment (leaving the park for dinner, hearing "no" at the store, sharing a toy), offers three picture choices, and plays out what happens next. Champion choices earn stars, stickers, chapter trophies and new buddies. "Uh oh" choices show a gentle consequence and let the child try again.

## Play

The whole game is one file: `choice-champs.html`. It is published as a Claude artifact at https://claude.ai/artifact/Rogzk3tdeM9WSQBbKzuQYc

The file has no `<!doctype>` or `<head>` because the artifact host adds them. To preview it locally, wrap it with a UTF-8 charset header:

```bash
mkdir -p /tmp/cc && ln -sfn "$PWD/audio" /tmp/cc/audio && { printf '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n'; cat choice-champs.html; } > /tmp/cc/index.html && python3 -m http.server 8765 --directory /tmp/cc
```

## Voice

Every line is pre-recorded in a natural voice (Kokoro, an open-source text-to-speech model) and stored in `audio/` as `<hash>.mp3`, where the hash is taken from the spoken text. `audio/manifest.js` lists which lines have recordings. A line with no recording falls back to the device's built-in voice, and parents can also switch to a device voice in the Grown-ups corner.

When publishing the artifact, include `audio/manifest.js` and every `audio/*.mp3` file alongside the page.

The child's name and custom prize text can't be pre-recorded, so the recorded lines leave them out.

**After changing any story text, re-record:**

```bash
node tools/list-lines.js > /tmp/lines.json
./venv/bin/python tools/make-voice.py /tmp/lines.json --models <folder with the model files>
```

Only new or changed lines are recorded. Setup steps are at the top of `tools/make-voice.py`. To change voices, pass `--voice` (for example `af_bella` or `am_michael`), which re-records everything.

## Adding stories

Stories live in the `CHAPTERS` array near the top of the script. Each scenario has:

- `steps`: story scenes (`bg`, `actors`, `text`), or `{ type: 'breathe', text }` for the balloon-breathing break
- `ask`: the question
- `choices`: three options with `ok: true` (finishes the story) or `ok: false` (shows the consequence, then retry)
- `tip`: a note for parents, shown in the Grown-ups corner

In text, `{G}` becomes what the child calls the grown-up (Mom, Dad...) and `{N}` the child's name. In `actors`, `BUDDY`, `GROWNUP` and `FRIEND` are swapped for the right emoji.

Progress is saved in the browser's local storage on each device.
