# ScholarFlow Pro

Created by **Gabriel Chiazor Unomah**.

I built ScholarFlow Pro while applying for scholarships and graduate programmes. Each portal asked for my degree, GPA and referee contacts again. This extension lets you save those details once, see which fields match on the current page, and choose what to fill.

![ScholarFlow Pro launch poster showing a saved student profile filling an application form](assets/scholarflow-launch.webp)

## Install in Chrome or Edge

1. On GitHub, choose **Code → Download ZIP** and extract the archive.
2. Open `chrome://extensions` or `edge://extensions`, enable **Developer mode**, and choose **Load unpacked**.
3. Select the extracted folder containing `manifest.json`. Keep that folder on your computer.
4. Open ScholarFlow Pro from the Extensions menu. Choose **Master profile**, enter the details you want to reuse, and click **Save profile**.

## Fill an application

Open an application page and choose **Scan current page**. Review the proposed field and value for each match. Change the selection or choose **Leave untouched**, then click **Fill selected fields**. Review the portal and scan again after moving to the next page. Essays, uploads and submission are manual. Some custom controls and embedded forms may require manual entry.

The **Dashboard** includes an application tracker, a document checklist and an answer bank. The extension stores records in your browser. Fields you choose to fill become available to the destination website. Exported backups contain readable personal data. Keep your backups private.

## Work on the project

Fork the repository and clone your fork. Load its directory as the unpacked extension. The extension runs directly from source with no build step.

- Edit `schema.js` to add a profile field or a new label that portals use.
- Edit `pro-engine.js` to change how the scanner recognizes and fills controls.
- Run `node test-pro.cjs` to check matching, review-before-fill, and empty profile defaults.
- For a manual check, run `python -m http.server 8000 --bind 127.0.0.1` from the repository and open `http://127.0.0.1:8000/test-form.html`. Save a fictional profile, scan the practice form, and check which values the extension proposes.

Contributions are welcome. For a missed field, open an issue with the field label and a fictional example. For a code change, open a pull request describing what changed and how you tested it.

## License

MIT. See [LICENSE](LICENSE).
