# Gemini AI Commander for Obsidian

A simple, fast, and highly customizable AI assistant for your Obsidian vault, powered by the Google Gemini API. Process your notes, summarize audio lectures, and chat with your files—all without leaving your workflow.

*This is my first Obsidian plugin EVER, so I hope you enjoy it!*

<small><i><s>(in all honesty im just surprised it even works lol)</s></i></small>

---

## ✨ Features

- **💬 Chat:** Ask Gemini a quick question and insert the answer directly into your note.
- **📝 Summarize (Replace or Insert):** Process the current note text and attached files to generate structured notes based on your customizable Default Action.
- **🧠 Chat w/ File (Replace or Insert):** Provide custom instructions (e.g., "Translate this to Spanish" or "Explain this concept") to process the current note and its attachments.
- **⚡ Real-Time Streaming (v1.2.0+):** Watch the AI type out its response right before your eyes! No more waiting for massive blocks of text to load all at once.
- **🛑 Cancel Kill-Switch (v1.2.0+):** Changed your mind or gave the wrong prompt? Instantly stop the AI's generation mid-sentence using the command palette or the sidebar ribbon button.
- **📎 Universal File Support:** Just drag and drop a file into your note! Automatically reads media, documents, embedded notes, and drawings (see supported formats below).
- **🛡️ Safe Fallbacks & Error Catching:** If the API fails, your rate limit is hit, or your internet drops, the plugin safely reverts your note so you never lose your original text.

## 🗂️ Plugin & File Support

Gemini AI Commander is built to understand your vault, no matter how you link or format your files. It natively processes Wiki-links (`![[File]]`), standard Markdown links (`![Image](file)`), aliases, and block references.

**Natively Supported Formats:**
- **📝 Note Transclusion:** Embed standard notes directly into your prompt (`.md`, `.txt`, `.canvas`).
- **🖼️ Images:** `.png`, `.jpg`, `.jpeg`, `.webp`, `.heic`
   - **NOTE**: This WILL NOT read `.svg` or similar vector-based image files. 
- **🎧 Audio:** `.mp3`, `.m4a`, `.mp4`, `.wav`, `.webm`
- **📄 Documents:** `.pdf`

**🎨 Excalidraw Integration (v1.1.0+):**
Gemini AI Commander now features integration with the official **Excalidraw** plugin! When you embed a `.excalidraw` or `.excalidraw.md` file, the plugin bypasses your physical hard drive and uses Excalidraw's developer API to render a high-res image directly in your device's active RAM. 
- **NOTE**: Excalidraw Integration ONLY READS FILES ending in `.excalidraw` or `.excalidraw.md`; this WILL NOT read `.excalidraw.svg` files, and it will use standard image processing for `.excalidraw.png` files, so MAKE SURE YOUR FILES ARE UPDATED!

## 🚀 Getting Started

To use this plugin, you will need a **free** API key from Google AI Studio.

1. Go to [Google AI Studio](https://aistudio.google.com/) and sign in with your Google account.
2. Click **Get API Key** and generate a new key (no credit card required).
3. Open Obsidian, go to **Settings > Gemini AI Commander**, and paste your key.

### ⚙️ Recommended Settings
- **Model:** `gemini-2.5-flash` (Highly recommended! It has a massive 1-million token context window, is incredibly fast, and is very friendly to the Free Tier rate limits).
- **Temperature:** `0.2` (Keeps the AI factual, structured, and strictly adherent to your formatting instructions).

## 📦 Installation (via BRAT)

Currently, this plugin is available via [BRAT](https://github.com/TfTHacker/obsidian42-brat) (Beta Reviewer's Auto-update Tool) before it gets submitted to the official Obsidian Community Plugins list.

1. Install the **BRAT** plugin from the official Obsidian Community Plugins directory and enable it.
2. Open the command palette (`Cmd/Ctrl + P`) and run the command **BRAT: Add a beta plugin for testing**.
3. Paste the URL of this GitHub repository: `https://github.com/EtsefZale/obsidian_gemini-ai-commander`
4. Click **Add Plugin**.
5. Go to **Settings > Community Plugins**, find **Gemini AI Commander**, and turn it on!

## 🤝 Credits & Inspiration

This plugin was heavily inspired by the incredible work of Simon Yang on his [AI Commander](https://github.com/yzh503/obsidian-aicommander-plugin) plugin (which utilizes OpenAI models). His work is way more advanced than mine, so absolutely go check his plugin out!

## ⚖️ License & Usage

This project is open-source under the **MIT License**. You are free to fork, modify, and use this code for your own projects, provided you include the original copyright notice and license file.

*Original creation by [Joshua Boyd / Etsef Zale (ΣПᗪΣЯ / Zaine (Z4I7E))](https://ender.website).*