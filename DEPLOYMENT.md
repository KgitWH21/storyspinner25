# How to Run StorySpinner 25 on Mobile & Desktop

You can access StorySpinner 25 on any device (phone, tablet, laptop) without needing Antigravity open, as long as you have the files.

## Option 1: Local Network (Quickest)
Since you are already running a local server (`python -m http.server`), you can access the app from your phone if it's on the **same Wi-Fi network**.

1.  **Find your Computer's IP Address**:
    *   Open a new terminal (PowerShell/CMD).
    *   Type `ipconfig` and press Enter.
    *   Look for **IPv4 Address** (e.g., `192.168.1.15`).
2.  **Open on Phone**:
    *   Open your phone's browser (Chrome/Safari).
    *   Type `http://YOUR_IP_ADDRESS:8000` (e.g., `http://192.168.1.15:8000`).
3.  **Install as App (PWA)**:
    *   **iOS (Safari)**: Tap the "Share" button -> "Add to Home Screen".
    *   **Android (Chrome)**: Tap the three dots menu -> "Install App" or "Add to Home Screen".
    *   The app will now appear on your home screen like a native app!

## Option 2: GitHub Pages (Permanent & Public)
To access the app from *anywhere* (not just your home Wi-Fi), you can host it for free on GitHub.

### Step 1: Create Repository
1.  Log in to [GitHub.com](https://github.com).
2.  Click the **+** icon in the top right -> **New repository**.
3.  Name it `storyspinner` (or whatever you like).
4.  Make it **Public**.
5.  **Do not** check "Initialize with README" (we already have one).
6.  Click **Create repository**.

### Step 2: Push Code
I have already initialized the git repository and committed your files locally. You just need to connect it to GitHub:

1.  Open a terminal in this folder.
2.  Run these two commands:
    ```bash
    git remote add origin https://github.com/KgitWH21/storyspinner25.git
    git push -u origin main
    ```

### Step 3: Enable Pages
1.  Go to your repository **Settings** -> **Pages**.
2.  Under **Build and deployment** -> **Branch**, select `main` and click **Save**.
3.  Wait a minute, and GitHub will give you a link (e.g., `https://KgitWH21.github.io/storyspinner25`).
4.  Visit that link on any device to use and install the app!

## Option 3: Run Locally on Desktop (Offline)
If you just want to run it on this computer without the python command:
1.  You can just double-click `index.html`!
    *   *Note*: Some features (like loading the JSON data) might be blocked by browser security policies when opening a file directly (`file://`).
    *   **Solution**: It's best to keep using the `python -m http.server` command or use a VS Code extension like "Live Server".
