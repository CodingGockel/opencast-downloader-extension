[English](./README.md) | [Deutsch](./README.de.md)

---

# Moodle Opencast Video Downloader

This is a simple Chrome extension developed to download Opencast video streams (lectures and slides) from Moodle.

The extension automatically detects the video stream in Moodle and provides a simple interface in the browser's side panel to start the download.

## ✨ Features

*   **Automatic Detection:** Automatically detects the video stream's URL template as soon as the video starts playing.
*   **Live Progress Display:** Displays a detailed log with the download's progress.
*   **Manual Adjustment:** Allows for manual editing of the detected URL, e.g., to download the slides stream instead of the video recording.

---

## ⚙️ Installation (Step-by-Step)

Since this extension is not in the official Chrome Web Store, it must be loaded manually in developer mode.

1.  **Download the project folder:** Make sure you have saved the entire project folder to your computer.
2.  **Open Chrome:** Start Google Chrome and navigate to the page `chrome://extensions`.
3.  **Enable Developer Mode:** In the top right corner, enable the switch for **"Developer mode"**.
4.  **Load the extension:** New buttons will appear. Click on **"Load unpacked"**.
5.  **Select the folder:** A file dialog will open. Select the **entire project folder** (not an individual file within it).
6.  **Done!** The extension is now installed and visible in your extension list. Its icon will appear in your toolbar.

---

## 🚀 Usage

### 1. Standard Download (Lecturer Video)

1.  Navigate to the recording you want to download in Moodle.
2.  Open the extension's side panel by clicking on the extension icon in your Chrome toolbar. The panel will initially state "Scanning for video stream...".
3.  Press **"Play"** on the webpage to start the video.
4.  **Wait a moment.** The extension will automatically detect the stream. The status in the side panel will change to "Video stream detected!", and the URL template will be inserted into the text field.
5.  Click the now-active **"Start Download"** button.
6.  Choose a save location on your computer. The download will begin and you can watch the progress live in the log window.

> **Important Note:** The side panel must remain open during the entire download process! If you close it, the download will be aborted.

### 2. Downloading Multiple Videos in Succession

To ensure that the URL for the next video is detected correctly, the extension's state must be reset.

1.  After a successful download, close the extension's **side panel**.
2.  Navigate to the page of the next video.
3.  Open the side panel **again** and repeat the steps from the standard download.

### 3. Downloading Slides Only (Presentation View)

Sometimes, in addition to the lecturer's video, there is a separate stream for the slides being shown.

1.  Follow the steps for the standard download until the URL appears in the extension's text field.
2.  **Do not press "Start Download" yet!**
3.  Click into the text field and edit the URL manually: Replace the word `presenter` with `presentation`.
    *   **Example:**
        `..._presenter.smil/...`
        becomes
        `..._presentation.smil/...`
4.  Click "Start Download" **now**.

