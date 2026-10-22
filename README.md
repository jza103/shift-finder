# Shift Finder

Drop in the weekly banquet service schedule PDF, pick a name, and see that person's week: in-times, functions, locations, guest counts, and special uniforms. One tap adds the shifts to iPhone Calendar.

The schedule is read entirely on your device. Nothing is uploaded.

**Live:** https://jza103.github.io/shift-finder/ (add `#yourname` to preselect a name, e.g. `#vanessa`)

## Using it on iPhone

**Fastest: straight from Mail (one-time setup).** Build a small Shortcut, and from then on you open the schedule PDF in Mail, tap **Share**, then **Shift Finder**, and the page opens with the schedule already loaded. The steps are on the page under *iPhone: open the schedule straight from Mail*, and below.

1. Open the **Shortcuts** app, tap **+**, and name it **Shift Finder**.
2. Tap **ⓘ**, turn on **Show in Share Sheet**, set the accepted input to **PDFs** only, and set *If there's no input* to **Ask For Files**.
3. Add **Base64 Encode** and set **Line Breaks** to **None**.
4. Add **Copy to Clipboard**. Turning on **Local Only** is optional.
5. Add **Text**: `https://jza103.github.io/shift-finder/#pdf=` followed by the **Base64 Encoded** variable. Use `#vanessa&pdf=` instead to preselect a name.
6. Add **Open URLs**.

The PDF rides in the part of the link after `#`, which browsers never send to a server, so the schedule still stays on the phone. The page removes it from the address bar as soon as it loads. If a link ever arrives cut off, the page offers a **Paste from Shortcut** button that reads the copy the Shortcut put on the clipboard. If Safari refuses to open the long link at all, change step 5 to `https://jza103.github.io/shift-finder/#paste` and use the paste button every time.

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
