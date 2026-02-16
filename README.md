# Gemini AI Commander for Obsidian

A simple, fast, and highly customizable AI assistant for your Obsidian vault, powered by the Google Gemini API. Process your notes, summarize audio lectures, and chat with your files—all without leaving your workflow.

*This is my first Obsidian plugin EVER, so I hope you enjoy it!*

<small><i><s>(in all honesty im just surprised it even works lol)</s></i></small>

---

## ✨ Features

- **💬 Chat:** Ask Gemini a quick question and insert the answer directly into your note.
- **📝 Summarize (Replace or Insert):** Process the current note text and attached files to generate structured notes based on your customizable Default Action.
- **🧠 Chat w/ File (Replace or Insert):** Provide custom instructions (e.g., "Translate this to Spanish" or "Explain this concept") to process the current note and its attachments.
- **📎 Multimodal File Support:** Just drag and drop a file into your note! Automatically reads and processes **Audio** (mp3, m4a, mp4, wav, webm), **Images** (png, jpg, webp, heic), and **PDFs**.
- **⏳ Native Loading UI:** Clean `> [!info] ⏳ Gemini is thinking...` callouts let you know when the AI is processing.
- **🛡️ Safe Fallbacks & Error Catching:** If the API fails, your rate limit is hit, or your internet drops, the plugin safely reverts your note so you never lose your original text.

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
