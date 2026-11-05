# Shift Finder

Drop in the weekly banquet service schedule PDF, pick a name, and see that person's week: in-times, functions, locations, guest counts, and special uniforms. One tap adds the shifts to iPhone Calendar.

The schedule is read entirely on your device. Nothing is uploaded.

**Live:** https://jza103.github.io/shift-finder/ (add `#yourname` to preselect a name, e.g. `#vanessa`)

> **🚧 Beta.** Shift Finder is still learning to read schedules and is **not responsible for missed or late shifts.** Check your times against the PDF, and when in doubt, go with the earlier time.

## Using it on iPhone

**Fastest: straight from Mail (one-time setup).** Add the ready-made Shortcut from https://www.icloud.com/shortcuts/6af661108f4c477687e930bb4aaf6017 (tap **Add Shortcut**), or build it with the steps below. From then on, open the schedule PDF in Mail, tap **Share**, then tap the shortcut. The page opens; tap **Paste from Shortcut**, then **Paste**, and your week appears. The steps are also on the page under *iPhone: open the schedule straight from Mail*.

1. Open the **Shortcuts** app, tap **+**, and rename the new shortcut **Shift Finder** by tapping its name at the top.
2. Add **Base64 Encode**. Tap the blue **Input** word in it and choose **Shortcut Input**.
3. A block appears at the top: *Receive **Any** input from **Nowhere***. Tap **Nowhere** and check **Share Sheet**. Optionally tap **Any** and leave only **PDFs** on. (If there's no such block, open the shortcut's Details from its name at the top, or the ⓘ or ⋯ button, and turn on **Show in Share Sheet**.)
4. Add **Copy to Clipboard**.
5. Add **Text**: `https://jza103.github.io/shift-finder/#paste`
6. Add **Open URLs**.

To use it, tap the PDF in Mail, tap **Share**, and scroll to the bottom to tap the shortcut. If it isn't listed, use **Edit Actions…** at the bottom of the share sheet to add it.

The Shortcut hands the PDF to the page through the clipboard, so the schedule stays on the phone. Safari needs a tap before a page can read the clipboard, which is why there's a Paste button.

*One-tap variant (not working yet):* the page also accepts the PDF in the link itself, as `#pdf=<base64>` (Text step: `https://jza103.github.io/shift-finder/#pdf=` plus the **Base64 Encoded** variable, with Line Breaks set to None). That skips the paste, but the first try on an iPhone opened the page without a schedule. A typical schedule makes a link of about 1 MB, which iOS appears not to pass along intact. If a link arrives cut off, the page now reports how many characters it received.

**Without the Shortcut:**

1. Save the schedule PDF from the email to Files.
2. Open the link above in Safari and tap **Choose PDF**. The saved PDF is at the top of **Recents**.
3. Pick your name, then tap **Add shifts to Calendar** → **Add All**.

If a revised schedule comes out, do the same thing again. Each event has a stable ID, so Calendar should update the existing events rather than duplicate them. This hasn't been confirmed on an iPhone yet.

## Notes

- End times are estimates, because the schedule doesn't list them. Evening shifts are 6 hours and earlier shifts are 4 hours.
- When a cell or column lists more than one in-time, the earliest one is shown, with a **Check**. Better early than late.
- Columns and rows are read from the cell borders drawn in the PDF. The columns are also worked out separately from where the header text lines up. If the borders can't be read (or a header cell is merged), the text alignment is used instead. If the two readings disagree about a column, or a column header still holds two events, that shift gets a **Check**. Exports at any zoom, paper size or column width read the same way: every distance the parser uses, including how thin a border must be, is measured against the page's own text size. Hairline to thick borders are read; borders thicker than about a third of the text height fall back to text alignment.
- The three availability columns (AM, Lunch, PM) are read from their drawn borders too, and checked against where the X and / marks cluster. If the two disagree, that day's availability is treated as unknown and the give-away list says X marks weren't checked.
- Items marked **Check** are cells that don't add up. For example, a shift letter that doesn't match its column usually means a typo on the schedule. Confirm these with the schedule maker.
- Only the PDF exported from Excel works. Scans and photos don't.

## Development

The whole app is `index.html`: the page, its styles, and the schedule parser (the `// BQT schedule parser` script block, which has no DOM code).

The version and last-updated date are at the bottom of the page (`footer .version` in `index.html`). Bump both with every change that ships.

### Tests

```
npm test
```

Needs Node 22 or later and nothing else. The tests also run on every pull request (GitHub Actions).

- `test/schedule.test.js` checks a real week (WE 11/13/2026) end to end. It compares against a snapshot of every shift, note and give-away list, and has named checks for bugs already fixed, like Vanessa's 10a lunch that read as 10:30a.
- `test/robustness.test.js` re-reads the same week zoomed 0.5× to 3×, with hairline to thick borders, with no borders, with a border missing, and with text nudged out of line. It checks that the results stay the same, or that the right Check shows up.
- `test/time.test.js` and `test/borders.test.js` are small unit tests for reading times and reading cell borders.

When a change is meant to alter what the app shows, run `UPDATE=1 npm test`, then review the diff of `test/fixtures/*.expected.json` before committing it. To see what a change broke, run `PARSER_HTML=path/to/other/index.html npm test` against another version of the page.

**Adding a week as a test fixture.** Run `npm install` once (it fetches pdf.js), then `npm run fixture -- <schedule.pdf> <name> --keep Vanessa`. The fixture keeps every position from the PDF but replaces each person's name (except those listed with `--keep`) and each event location. The repo is public, so never commit the PDF itself. Copy the snapshot test in `test/schedule.test.js` for the new fixture.
