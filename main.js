const obsidian = require('obsidian');

// 1. Establish the default settings and Welcome Message
const DEFAULT_SETTINGS = {
    apiKey: '',
    model: 'gemini-2.5-flash',
    temperature: 0.2,
    defaultAction: "Summarize the notes, audio, and files included. Structure the summary with a clear main title, bullet points for key concepts, and blockquotes for important definitions or quotes. Ensure the information is logically organized and easy to scan.",
    systemInstruction: "Format the response strictly in Markdown, optimized for Obsidian.md.\n- Use standard Markdown syntax for headings, bulleted lists, and emphasis.\n- Use LaTeX syntax for all mathematical, physical, or engineering formulas. Strictly enclose inline math within single dollar signs ($equation$) and standalone display math within double dollar signs ($$equation$$). Do not use plain Unicode for math.\n- Enclose inline code within single backticks (`code`) and multi-line code within triple backticks (```language ... ```).\n- Maintain a clear, highly structured, and easily readable format. Do not include conversational filler; only output the requested formatting."
};

const WELCOME_MESSAGE = `You didn't include any notes, files, or prompts, which are required for the plugin to do anything.
...so you should probably do that.

In case you're still confused, here are some quick instructions:
### How to Use Gemini AI Commander
- **Chat**: Ask a quick question and insert the answer directly.
- **Summarize (Replace/Insert)**: Process the current note text and attached files to generate structured notes based on your Default Action.
- **Chat w/ File (Replace/Insert)**: Provide custom instructions to process the current note and attached files.
- **Other files (PDF, Audio, Image, etc.)**: Just add a link to the file in the note and it’ll automatically be included in the "Summarize" and "Chat w/ File" options!

---

Heyo!
I’m Etsef, but most people know me as ΣПᗪΣЯ. I just wanted to thank you for downloading my plugin; this is my first Obsidian plugin *EVER*, so I hope you like it!
<small><i><s>(in all honesty im just surprised it even works lol)</s></i></small>

This plugin is inspired by Simon Yang’s “ai-commander”, which uses OpenAI models instead of Gemini. His stuff is WAY more advanced than mine, so make sure to check his plugin out on Github [here](https://github.com/yzh503/obsidian-aicommander-plugin).

This was made in the span of an afternoon, so if there’s any bugs or issues, feel free to let me know via the plugin’s Github repo [here](https://github.com/EtsefZale/obsidian_gemini-ai-commander).

Thank you again for downloading the plugin, and I hope you enjoy!

-Etsef Zale
https://ender.website`;

// 2. Build the Settings Tab
class GeminiSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Gemini AI Commander Settings' });

        new obsidian.Setting(containerEl)
            .setName('Gemini API Key')
            .setDesc('Enter your Google AI Studio API key.')
            .addText(text => text
                .setPlaceholder('Enter your API key')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Gemini Model')
            .setDesc('Choose the engine. Free Tier users should stick to Flash models to avoid hitting strict rate limits.')
            .addDropdown(drop => drop
                .addOption('gemini-2.5-flash', 'Gemini 2.5 Flash (Default, Fast, Free-Tier Friendly)')
                .addOption('gemini-2.5-pro', 'Gemini 2.5 Pro (Complex Reasoning, Lower Free Limits)')
                .addOption('gemini-3-flash', 'Gemini 3 Flash (Latest Gen, Fast)')
                .addOption('gemini-3-pro', 'Gemini 3 Pro (Latest Gen, Advanced)')
                .setValue(this.plugin.settings.model)
                .onChange(async (value) => {
                    this.plugin.settings.model = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(containerEl)
            .setName('Temperature')
            .setDesc('Controls creativity. 0.0 is strictly factual and rigid. 1.0 is highly creative. (Recommended for notes: 0.1 - 0.3)')
            .addText(text => text
                .setPlaceholder('0.2')
                .setValue(this.plugin.settings.temperature.toString())
                .onChange(async (value) => {
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed) && parsed >= 0 && parsed <= 2) {
                        this.plugin.settings.temperature = parsed;
                        await this.plugin.saveSettings();
                    }
                }));

        new obsidian.Setting(containerEl)
            .setName('Default Action')
            .setDesc('What should Gemini do when you run the Summarize commands?')
            .addTextArea(text => {
                text.setPlaceholder('E.g., Summarize the notes...')
                    .setValue(this.plugin.settings.defaultAction)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultAction = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.rows = 3;
                text.inputEl.cols = 50;
            });

        new obsidian.Setting(containerEl)
            .setName('System Formatting Instructions')
            .setDesc('Strict formatting rules for Gemini. Adjust this if you need different output types.')
            .addTextArea(text => {
                text.setPlaceholder('Enter your system instructions...')
                    .setValue(this.plugin.settings.systemInstruction)
                    .onChange(async (value) => {
                        this.plugin.settings.systemInstruction = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.rows = 8;
                text.inputEl.cols = 50;
            });
    }
}

// 3. Declare the custom instructions pop-up modal
class InstructionModal extends obsidian.Modal {
    constructor(app, isChatMode, defaultAction, onSubmit) {
        super(app);
        this.isChatMode = isChatMode;
        this.defaultAction = defaultAction;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: this.isChatMode ? 'Chat with Gemini' : 'Gemini Custom Instructions' });

        let instruction = '';
        const descText = this.isChatMode 
            ? 'Ask Gemini a question (this ignores the current file contents).' 
            : `Leave blank to fall back to default: "${this.defaultAction}"`;

        new obsidian.Setting(contentEl)
            .setName(this.isChatMode ? 'Your Question' : 'Instructions')
            .setDesc(descText)
            .addText((text) => {
                text.onChange((value) => {
                    instruction = value;
                });
                text.inputEl.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.close();
                        this.onSubmit(instruction);
                    }
                });
            });

        new obsidian.Setting(contentEl)
            .addButton((btn) => btn
                .setButtonText('Submit')
                .setCta()
                .onClick(() => {
                    this.close();
                    this.onSubmit(instruction);
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 4. Main Plugin Class
class GeminiAICommanderPlugin extends obsidian.Plugin {
    async onload() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        this.addSettingTab(new GeminiSettingTab(this.app, this));

        // --- COMMAND PALETTE ---
        this.addCommand({
            id: 'gemini-chat',
            name: 'Chat',
            editorCallback: (editor, view) => {
                new InstructionModal(this.app, true, null, (instruction) => {
                    this.processNotes(editor, view, 'Chat', instruction);
                }).open();
            }
        });

        this.addCommand({
            id: 'gemini-summarize-replace',
            name: 'Summarize (Replace)',
            editorCallback: (editor, view) => this.processNotes(editor, view, 'Replace', null)
        });

        this.addCommand({
            id: 'gemini-summarize-insert',
            name: 'Summarize (Insert)',
            editorCallback: (editor, view) => this.processNotes(editor, view, 'Insert', null)
        });

        this.addCommand({
            id: 'gemini-chat-file-replace',
            name: 'Chat w/ File (Replace)',
            editorCallback: (editor, view) => {
                new InstructionModal(this.app, false, this.settings.defaultAction, (instruction) => {
                    this.processNotes(editor, view, 'Replace', instruction);
                }).open();
            }
        });

        this.addCommand({
            id: 'gemini-chat-file-insert',
            name: 'Chat w/ File (Insert)',
            editorCallback: (editor, view) => {
                new InstructionModal(this.app, false, this.settings.defaultAction, (instruction) => {
                    this.processNotes(editor, view, 'Insert', instruction);
                }).open();
            }
        });

        // --- SIDEBAR RIBBON ---
        this.addRibbonIcon('sparkles', 'Gemini AI Commander', (evt) => {
            const view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
            
            if (!view) {
                new obsidian.Notice('Please open a markdown note first.');
                return;
            }

            const editor = view.editor;
            const menu = new obsidian.Menu();

            menu.addItem((item) =>
                item.setTitle('Chat')
                    .setIcon('message-circle')
                    .onClick(() => {
                        new InstructionModal(this.app, true, null, (instruction) => {
                            this.processNotes(editor, view, 'Chat', instruction);
                        }).open();
                    })
            );

            menu.addItem((item) =>
                item.setTitle('Summarize (Replace)')
                    .setIcon('file-edit')
                    .onClick(() => this.processNotes(editor, view, 'Replace', null))
            );

            menu.addItem((item) =>
                item.setTitle('Summarize (Insert)')
                    .setIcon('plus-circle')
                    .onClick(() => this.processNotes(editor, view, 'Insert', null))
            );

            menu.addItem((item) =>
                item.setTitle('Chat w/ File (Replace)')
                    .setIcon('message-square')
                    .onClick(() => {
                        new InstructionModal(this.app, false, this.settings.defaultAction, (instruction) => {
                            this.processNotes(editor, view, 'Replace', instruction);
                        }).open();
                    })
            );

            menu.addItem((item) =>
                item.setTitle('Chat w/ File (Insert)')
                    .setIcon('message-square-plus')
                    .onClick(() => {
                        new InstructionModal(this.app, false, this.settings.defaultAction, (instruction) => {
                            this.processNotes(editor, view, 'Insert', instruction);
                        }).open();
                    })
            );

            menu.showAtMouseEvent(evt);
        });
    }

    // --- CENTRALIZED PROCESSING LOGIC ---
    async processNotes(editor, view, action, customInstruction) {
        // ERROR CATCH 1: No API Key
        if (!this.settings.apiKey) {
            new obsidian.Notice('Error: Please set your Gemini API Key in the settings before running commands.');
            return;
        }

        let parts = [];
        let noticeText = `Sending to ${this.settings.model}...`;
        const rawText = editor.getValue();
        
        // Setup Loading Blocks
        const insertLoadingText = "\n\n> [!info] ⏳ Gemini is thinking...\n\n";
        const replaceLoadingText = "> [!info] ⏳ Gemini is rewriting your note...\n\n";

        // Global regex to catch multiple files (PDFs, Images, Audio)
        const fileRegex = /!\[\[(.*?\.(mp3|mp4|mpeg|mpga|m4a|wav|webm|png|jpg|jpeg|webp|heic|pdf))\]\]/ig;
        let hasFiles = false;
        let embedsToKeep = "";
        let match;

        const noInstruction = (!customInstruction || customInstruction.trim() === '');
        const tempMatch = rawText.match(fileRegex);
        const noContent = (rawText.trim() === '' && !tempMatch);

        // --- EMPTY NOTE SAFEGUARDS ---
        if (action === 'Chat' && noInstruction) {
            editor.replaceSelection(WELCOME_MESSAGE + "\n\n");
            return;
        }

        if (action !== 'Chat' && noContent && noInstruction) {
            if (action === 'Replace') {
                editor.setValue(WELCOME_MESSAGE);
            } else {
                editor.replaceSelection(WELCOME_MESSAGE + "\n\n");
            }
            return;
        }

        // 1. CHAT MODE (Ignores file content)
        if (action === 'Chat') {
            new obsidian.Notice(`Asking ${this.settings.model}...`);
            parts.push({ text: `User Query: ${customInstruction.trim()}` });
            editor.replaceSelection(insertLoadingText);
        } 
        // 2. FILE PROCESSING MODE
        else {
            if (customInstruction && customInstruction.trim() !== '') {
                noticeText = `Sending to ${this.settings.model} with custom instructions...`;
            } else {
                noticeText = `Sending to ${this.settings.model} with default action...`;
            }
            new obsidian.Notice(noticeText);

            while ((match = fileRegex.exec(rawText)) !== null) {
                hasFiles = true;
                embedsToKeep += match[0] + "\n"; 
                
                const filename = match[1];
                const extension = match[2].toLowerCase();
                const file = this.app.metadataCache.getFirstLinkpathDest(filename, view.file.path);
                
                if (file) {
                    new obsidian.Notice(`Processing file: ${filename}...`);
                    const binary = await this.app.vault.readBinary(file);
                    const base64 = obsidian.arrayBufferToBase64(binary);
                    
                    let mimeType = 'application/octet-stream';
                    if (['png', 'jpg', 'jpeg', 'webp', 'heic'].includes(extension)) {
                        mimeType = extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;
                    } else if (extension === 'pdf') {
                        mimeType = 'application/pdf';
                    } else {
                        mimeType = 'audio/' + extension;
                        if (extension === 'm4a') mimeType = 'audio/x-m4a';
                        else if (extension === 'mp4') mimeType = 'video/mp4';
                    }

                    parts.push({
                        inlineData: { mimeType: mimeType, data: base64 }
                    });
                } else {
                    // ERROR CATCH 2: File missing from vault
                    new obsidian.Notice(`Warning: Could not find file '${filename}' in the vault.`);
                }
            }

            const cleanedText = rawText.replace(fileRegex, '').trim();
            
            let promptText = "";
            if (customInstruction && customInstruction.trim() !== '') {
                promptText = `User Instructions: ${customInstruction.trim()}\n\n`;
            } else {
                promptText = `User Instructions: ${this.settings.defaultAction}\n\n`;
            }
            
            promptText += "Source Material:\n" + cleanedText;

            if (action === 'Insert') {
                promptText += "\n\n(IMPORTANT: The user is inserting your response into their existing note. Do not rewrite or repeat the existing note text above. ONLY output the new content to be inserted.)";
                editor.replaceSelection(insertLoadingText);
            } else if (action === 'Replace') {
                editor.setValue(replaceLoadingText + rawText);
            }

            parts.push({ text: promptText });
        }

        // --- API CALL ---
        try {
            const response = await obsidian.requestUrl({
                url: `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.model}:generateContent?key=${this.settings.apiKey}`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: this.settings.systemInstruction }] },
                    contents: [{ parts: parts }],
                    generationConfig: { temperature: this.settings.temperature }
                })
            });

            if (response.status === 200) {
                const result = response.json.candidates[0].content.parts[0].text;
                const currentText = editor.getValue();
                
                if (action === 'Replace') {
                    const finalNote = hasFiles ? embedsToKeep + "\n" + result : result;
                    editor.setValue(finalNote);
                } else if (action === 'Insert' || action === 'Chat') {
                    const newText = currentText.replace(insertLoadingText, "\n\n" + result + "\n\n");
                    editor.setValue(newText);
                }
                
                new obsidian.Notice(`Gemini Action completed successfully!`);
            } else {
                // ERROR CATCH 3: Explicit API Rejections
                this.revertLoadingState(editor, action, insertLoadingText, replaceLoadingText);
                
                if (response.status === 400) {
                    new obsidian.Notice('Error 400: Invalid request. Check if your file type is supported.');
                } else if (response.status === 401 || response.status === 403) {
                    new obsidian.Notice('Error 401/403: Invalid API Key. Please double-check your settings.');
                } else if (response.status === 429) {
                    new obsidian.Notice('Error 429: Rate limit exceeded. You may be making requests too quickly on the Free Tier.');
                } else {
                    // Try to parse Google's exact error message if it's something else
                    let errorMsg = `API Error ${response.status}`;
                    if (response.json && response.json.error && response.json.error.message) {
                        errorMsg += `: ${response.json.error.message}`;
                    }
                    new obsidian.Notice(errorMsg);
                }
            }
        } catch (error) {
            // ERROR CATCH 4: Complete Network Failure (No Wi-Fi, DNS Block, etc.)
            console.error("Gemini API Error:", error);
            this.revertLoadingState(editor, action, insertLoadingText, replaceLoadingText);
            new obsidian.Notice('Network Error: Failed to connect to Google API. Are you connected to the internet?');
        }
    }

    // Helper to gracefully revert the note if the API fails
    revertLoadingState(editor, action, insertLoadingText, replaceLoadingText) {
        const currentText = editor.getValue();
        if (action === 'Replace') {
            editor.setValue(currentText.replace(replaceLoadingText, ""));
        } else if (action === 'Insert' || action === 'Chat') {
            editor.setValue(currentText.replace(insertLoadingText, ""));
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

module.exports = GeminiAICommanderPlugin;
