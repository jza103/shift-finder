# Shift Finder

Drop in the weekly banquet service schedule PDF, pick a name, and see that person's week: in-times, functions, locations, guest counts, and special uniforms. One tap adds the shifts to iPhone Calendar.

The schedule is read entirely on your device. Nothing is uploaded.

**Live:** https://jza103.github.io/shift-finder/ (add `#yourname` to preselect a name, e.g. `#vanessa`)

## Using it on iPhone

**Fastest: straight from Mail (one-time setup).** Build a small Shortcut. From then on, open the schedule PDF in Mail, tap **Share**, then **Shift Finder**. The page opens; tap **Paste from Shortcut**, then **Paste**, and your week appears. The steps are also on the page under *iPhone: open the schedule straight from Mail*.

1. Open the **Shortcuts** app, tap **+**, and rename the new shortcut **Shift Finder** by tapping its name at the top.
2. Add **Base64 Encode**. Tap the blue **Input** word in it and choose **Shortcut Input**.
3. A block appears at the top: *Receive **Any** input from **Nowhere***. Tap **Nowhere** and check **Share Sheet**. Optionally tap **Any** and leave only **PDFs** on. (If there's no such block, open the shortcut's Details from its name at the top, or the ⓘ or ⋯ button, and turn on **Show in Share Sheet**.)
4. Add **Copy to Clipboard**.
5. Add **Text**: `https://jza103.github.io/shift-finder/#paste`
6. Add **Open URLs**.

To use it, tap the PDF in Mail, tap **Share**, and scroll to the bottom to tap **Shift Finder**. If it isn't listed, use **Edit Actions…** at the bottom of the share sheet to add it.

The Shortcut hands the PDF to the page through the clipboard, so the schedule stays on the phone. Safari needs a tap before a page can read the clipboard, which is why there's a Paste button.

*One-tap variant (not working yet):* the page also accepts the PDF in the link itself, as `#pdf=<base64>` (Text step: `https://jza103.github.io/shift-finder/#pdf=` plus the **Base64 Encoded** variable, with Line Breaks set to None). That skips the paste, but the first try on an iPhone opened the page without a schedule. A typical schedule makes a link of about 1 MB, which iOS appears not to pass along intact. If a link arrives cut off, the page now reports how many characters it received.

**Without the Shortcut:**

1. Save the schedule PDF from the email to Files.
2. Open the link above in Safari and tap **Choose PDF**. The saved PDF is at the top of **Recents**.
3. Pick your name, then tap **Add shifts to Calendar** → **Add All**.

If a revised schedule comes out, do the same thing again. Each event has a stable ID, so Calendar should update the existing events rather than duplicate them. This hasn't been confirmed on an iPhone yet.

## Notes

- End times are estimates, because the schedule doesn't list them. Evening shifts are 6 hours and earlier shifts are 4 hours.
- Items marked **Check** are cells that don't add up. For example, a shift letter that doesn't match its column usually means a typo on the schedule. Confirm these with the schedule maker.
- Only the PDF exported from Excel works. Scans and photos don't.

## Development

See `CLAUDE.md`. In short: `npm install`, edit `src/`, then `npm run build` and `npm test`.
