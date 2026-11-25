# StorySpinner 25

A mobile-friendly web application for generating characters, story seeds, music prompts, and art styles using existing JSON data.

## Setup & Installation

1.  **Files**: Ensure the following files are in the same directory:
    *   `index.html`
    *   `style.css`
    *   `app.js`
    *   `character_elements.json`
    *   `story_elements.json`
    *   `music_elements.json`
    *   `art_elements.json`

2.  **Running Locally**:
    *   Due to browser security restrictions (CORS), you cannot simply double-click `index.html` to load the JSON files.
    *   You must run a local web server.
    *   **Option A (VS Code)**: Install the "Live Server" extension, right-click `index.html`, and select "Open with Live Server".
    *   **Option B (Python)**: Open a terminal in the folder and run:
        *   `python -m http.server` (then go to `http://localhost:8000`)
    *   **Option C (Node)**: Run `npx http-server` (then go to the provided URL).

## Updating Data

*   The application reads directly from the JSON files.
*   To update the content (e.g., add new traits, genres, instruments, or art styles), simply edit the JSON files in a text editor.
*   **Do not change the structure** (keys or nesting) of the JSON files, as the code relies on the existing schema. You can safely add strings to existing arrays.

## Features

*   **Character Creator**: Generate unique characters with detailed appearance, personality, background, abilities, relationships, and story hooks.
*   **Story Spinner**: Create plot outlines with archetypes, themes, and conflicts.
*   **Music Prompts**: Generate inspiration for music composition.
*   **Art Style Spinner**: Pick two styles from a large list of movements, media, and regional looks.
*   **Tarot Arc Generator**: Draw 3-card tarot arcs using various layouts (e.g., "Classic Three-Card", "Problem/Action/Resolution").
*   **Story Prompt**: Spin a ready-to-paste writing prompt with form, length, optional tone, character, conflict, and craft notes. Copy it in one tap.
*   **Codex Spin**: Paste an old idea and roll three twists-- a new point of view, setting, stakes, genre, structure, or complication-- then copy the revival prompt.
*   **Favorites**: Star a prompt, revival, or character to save it. Copy or delete items later, or export all of them as a text file.
*   **Locking**: Click the padlock icon next to any field to lock its value while re-rolling others.
*   **Persistence**: Your last active tab, generated results, and lock states are saved automatically.
