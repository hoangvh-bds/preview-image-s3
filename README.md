# S3 Clone Chrome Extension

This repo is a Chrome Extension that uses `content.js` to inject a `Preview Images` button into the AWS S3 Console and open an image preview page from the current bucket contents.

## Repo Structure

- `manifest.json`: Extension configuration using Manifest V3.
- `content.js`: Injects the button into the page and handles the image preview logic.
- `style.css`: Styles for the injected button.

## How To Add This Repo To Chrome

1. Clone or download this repo to your machine.
2. Open Chrome and go to `chrome://extensions/`.
3. Turn on `Developer mode` in the top-right corner.
4. Click `Load unpacked`.
5. Select the root folder of this repo:

```text
../preview-image-s3
```

6. After loading, the `Bottom Button Runner` extension should appear in your extension list.

## How To Use

1. Open an AWS S3 Console page that matches this format:

```text
https://<region>.console.aws.amazon.com/s3/buckets/<bucket-name>
```

2. Reload the tab if it was already open before installing the extension.
3. On a supported bucket page, a `Preview Images` button will appear near the bottom of the page.
4. Click the button to read image files from the current bucket listing and open a new tab with image previews.

## Notes For Development

- This repo does not require a build step.
- Each time you change `manifest.json`, `content.js`, or `style.css`, go back to `chrome://extensions/` and click `Reload` on the extension.
- After reloading the extension, refresh the AWS Console tab so the content script runs again.

## If The Extension Does Not Work

- Make sure you are on a supported AWS S3 bucket page.
- Open `chrome://extensions/` and check `Details` or `Errors` for extension issues.
- Confirm the tab was refreshed after loading or reloading the extension.
