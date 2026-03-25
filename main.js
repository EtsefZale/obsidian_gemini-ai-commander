const obsidian = require('obsidian');

// 1. Establish the default settings and Welcome Message
const DEFAULT_SETTINGS = {
    apiKey: '',
    model: 'gemini-2.5-flash',
    temperature: 0.2,
    defaultAction: "Summarize the notes, audio, and files included. Structure the summary with a clear main title, bullet points for key concepts, and blockquotes for important definitions or quotes. Ensure the information is logically organized and easy to scan.",
    systemInstruction: "Format the response strictly in Markdown, optimized for Obsidian.md.\n- Use standard Markdown syntax for headings (#, ##, ###), bulleted (- Lorem Ipsum) / numbered (1. Lorem Ipsum) lists, emphasis (*italics*, **bold** (prioritized over <i>italics</i>, <b>bold</b>), etc.), and similar markdown.\n- Use ONLY OBSIDIAN-COMPATIBLE LaTeX SYNTAX for all mathematical, physical, or engineering formulas (EX: $y=3x^2$). Strictly enclose inline math within single dollar signs ($equation$) and standalone display math within double dollar signs ($$equation$$). Do not use plain Unicode for math.\n- Enclose inline code within single backticks (`code`) and multi-line code within triple backticks (```language ... ```).\n- Maintain a clear, highly structured, and easily readable format. Do not include conversational filler unless specified; only output the requested formatting.\n- For terms like tags (EX: #Vocab), DO NOT enclose them in code blocks. These must be placed in the document as plaintext."
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

        // --- 0. HEADER & LINKS ---
        const headerDiv = containerEl.createDiv();
        headerDiv.style.textAlign = 'center';
        headerDiv.style.marginBottom = '25px';
        headerDiv.style.padding = '15px';
        headerDiv.style.backgroundColor = 'var(--background-secondary)';
        headerDiv.style.borderRadius = '8px';
        headerDiv.style.border = '1px solid var(--background-modifier-border)';

        headerDiv.createEl('h3', { text: 'Gemini AI Commander' }).style.marginTop = '0';
        headerDiv.createEl('p', { text: 'Created by Etsef Zale (ΣПᗪΣЯ)' }).style.margin = '0 0 10px 0';
        
        headerDiv.createEl('a', { text: '🌐 ender.website', href: 'https://ender.website' });
        headerDiv.createEl('span', { text: '  •  ' });
        headerDiv.createEl('a', { text: '🐙 GitHub Repository', href: 'https://github.com/EtsefZale/obsidian_gemini-ai-commander' });

        // Helper function to style the collapsible summaries like Excalidraw headers natively
        const styleSummary = (summaryEl, text) => {
            summaryEl.style.cursor = 'pointer';
            summaryEl.style.fontWeight = '600';
            summaryEl.style.fontSize = 'var(--h3-size)'; // Native Obsidian header sizing
            summaryEl.style.color = 'var(--text-accent)'; // Native Obsidian theme color
            summaryEl.style.borderBottom = '1px solid var(--background-modifier-border)';
            summaryEl.style.paddingBottom = '8px';
            summaryEl.style.marginBottom = '10px';
            summaryEl.textContent = text;
        };

        // --- 1. GENERAL SETTINGS (Collapsible Dropdown) ---
        const generalDetails = containerEl.createEl('details', { attr: { open: '' } }); 
        generalDetails.style.marginBottom = '20px';
        const generalSummary = generalDetails.createEl('summary');
        styleSummary(generalSummary, 'General settings');

        new obsidian.Setting(generalDetails)
            .setName('Gemini API key') 
            .setDesc('Enter your Google AI Studio API key.')
            .addText(text => text
                .setPlaceholder('Enter your API key')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                }));
                
        new obsidian.Setting(generalDetails)
            .setName('Gemini model') 
            .setDesc('Choose the engine. Free Tier users should stick to Flash models to avoid hitting strict rate limits.')
            .addDropdown(drop => drop
                .addOption('gemini-2.5-flash', 'Gemini 2.5 Flash (Default, Fast, Free-Tier Friendly)')
                .addOption('gemini-2.5-pro', 'Gemini 2.5 Pro (Complex Reasoning, Paid Tier Required)')
                .addOption('gemini-3-flash-preview', 'Gemini 3 Flash (Latest Gen, Fast)')
                .addOption('gemini-3.1-pro-preview', 'Gemini 3.1 Pro (Latest Gen, Paid Tier Required)')
                .setValue(this.plugin.settings.model)
                .onChange(async (value) => {
                    this.plugin.settings.model = value;
                    await this.plugin.saveSettings();
                }));

        new obsidian.Setting(generalDetails)
            .setDesc('⚠️ NOTE: Google heavily restricts the "Pro" models on the Free Tier. If you get an "Error 429: Rate limit exceeded" immediately when using a Pro model, you must either switch back to a Flash model or upgrade your API key to a Pay-As-You-Go billing account in Google AI Studio.');

        new obsidian.Setting(generalDetails)
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
                }))
            .addExtraButton(btn => btn
                .setIcon('reset')
                .setTooltip('Reset to default temperature')
                .onClick(async () => {
                    this.plugin.settings.temperature = DEFAULT_SETTINGS.temperature;
                    await this.plugin.saveSettings();
                    this.display(); 
                    new obsidian.Notice('Temperature reset to default.');
                }));

        // --- 2. PROMPTS & INSTRUCTIONS (Collapsible Dropdown) ---
        const promptDetails = containerEl.createEl('details', { attr: { open: '' } }); 
        promptDetails.style.marginBottom = '20px';
        const promptSummary = promptDetails.createEl('summary');
        styleSummary(promptSummary, 'Prompts and instructions');

        const defaultActionSetting = new obsidian.Setting(promptDetails)
            .setName('Default action') 
            .setDesc('What should Gemini do when you run the Summarize commands?')
            .addTextArea(text => {
                text.setPlaceholder('E.g., Summarize the notes...')
                    .setValue(this.plugin.settings.defaultAction)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultAction = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.rows = 4;
                text.inputEl.style.width = '100%';
                text.inputEl.style.resize = 'vertical'; 
            })
            .addExtraButton(btn => btn
                .setIcon('reset')
                .setTooltip('Reset to default action')
                .onClick(async () => {
                    this.plugin.settings.defaultAction = DEFAULT_SETTINGS.defaultAction;
                    await this.plugin.saveSettings();
                    this.display(); 
                    new obsidian.Notice('Default action reset.');
                }));
        
        defaultActionSetting.settingEl.style.flexDirection = 'column';
        defaultActionSetting.settingEl.style.alignItems = 'stretch';
        defaultActionSetting.controlEl.style.marginTop = '10px';

        const sysInstructionSetting = new obsidian.Setting(promptDetails)
            .setName('System formatting instructions') 
            .setDesc('Strict formatting rules for Gemini. Adjust this if you need different output types.')
            .addTextArea(text => {
                text.setPlaceholder('Enter your system instructions...')
                    .setValue(this.plugin.settings.systemInstruction)
                    .onChange(async (value) => {
                        this.plugin.settings.systemInstruction = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.rows = 8;
                text.inputEl.style.width = '100%';
                text.inputEl.style.resize = 'vertical'; 
            })
            .addExtraButton(btn => btn
                .setIcon('reset')
                .setTooltip('Reset to default instructions')
                .onClick(async () => {
                    this.plugin.settings.systemInstruction = DEFAULT_SETTINGS.systemInstruction;
                    await this.plugin.saveSettings();
                    this.display(); 
                    new obsidian.Notice('System instructions reset.');
                }));

        sysInstructionSetting.settingEl.style.flexDirection = 'column';
        sysInstructionSetting.settingEl.style.alignItems = 'stretch';
        sysInstructionSetting.controlEl.style.marginTop = '10px';

        // --- 3. ADVANCED (Collapsible Dropdown) ---
        const advDetails = containerEl.createEl('details'); 
        advDetails.style.marginBottom = '20px';
        const advSummary = advDetails.createEl('summary');
        styleSummary(advSummary, 'Advanced');

        new obsidian.Setting(advDetails)
            .setName('Reset all settings')
            .setDesc('Restore every setting (including your API key) to its default state.')
            .addButton(btn => btn
                .setButtonText('Reset All')
                .setWarning() 
                .onClick(() => {
                    new ConfirmModal(
                        this.app,
                        "WARNING: This will reset the ENTIRE PLUGIN. Are you 100% sure you want to do this? (You'll need to re-enter your API key and re-select your preferred model as well.)",
                        async () => {
                            this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
                            await this.plugin.saveSettings();
                            this.display();
                            new obsidian.Notice('All settings have been completely reset.');
                        }
                    ).open();
                }));
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
        contentEl.createEl('h2', { text: this.isChatMode ? 'Chat with Gemini' : 'Gemini custom instructions' });

        let instruction = '';
        const descText = this.isChatMode 
            ? 'Ask Gemini a question (this ignores the current file contents). Shift + Enter for a new line.' 
            : `Leave blank to fall back to default: "${this.defaultAction}"\nShift + Enter for a new line.`;

        const instructionSetting = new obsidian.Setting(contentEl)
            .setName(this.isChatMode ? 'Your question' : 'Instructions') 
            .setDesc(descText)
            .addTextArea((text) => {
                text.onChange((value) => {
                    instruction = value;
                });
                text.inputEl.rows = 5;
                text.inputEl.style.width = '100%';
                text.inputEl.style.resize = 'vertical'; 
                text.inputEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.close();
                        this.onSubmit(instruction);
                    }
                });
            });

        instructionSetting.settingEl.style.flexDirection = 'column';
        instructionSetting.settingEl.style.alignItems = 'stretch';
        instructionSetting.controlEl.style.marginTop = '10px';

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

// 3.5 Declare the confirmation modal for complete resets
class ConfirmModal extends obsidian.Modal {
    constructor(app, message, onConfirm) {
        super(app);
        this.message = message;
        this.onConfirm = onConfirm;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: '⚠️ Warning' });
        contentEl.createEl('p', { text: this.message });

        new obsidian.Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Cancel')
                .onClick(() => {
                    this.close();
                }))
            .addButton(btn => btn
                .setButtonText('Yes, Reset Everything')
                .setWarning()
                .onClick(() => {
                    this.close();
                    this.onConfirm();
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
        this.abortController = null; // Used to pause/cancel processing

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
        
        // New Command: Cancel Processing
        this.addCommand({
            id: 'gemini-cancel',
            name: 'Cancel Processing',
            callback: () => {
                if (this.abortController) {
                    this.abortController.abort();
                } else {
                    new obsidian.Notice("No active Gemini process to cancel.");
                }
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
            
            // New Ribbon Menu Item: Cancel Processing
            menu.addItem((item) =>
                item.setTitle('Cancel Processing')
                    .setIcon('x-circle')
                    .onClick(() => {
                        if (this.abortController) {
                            this.abortController.abort();
                        } else {
                            new obsidian.Notice("No active Gemini process to cancel.");
                        }
                    })
            );

            menu.showAtMouseEvent(evt);
        });
    }

    // --- CENTRALIZED PROCESSING LOGIC ---
    async processNotes(editor, view, action, customInstruction) {
        if (!this.settings.apiKey) {
            new obsidian.Notice('Error: Please set your Gemini API Key in the settings before running commands.');
            return;
        }

        let parts = [];
        let noticeText = `Sending to ${this.settings.model}...`;
        const rawText = editor.getValue();
        
        const insertLoadingText = "\n\n> [!info] ⏳ Gemini is thinking...\n\n";
        const replaceLoadingText = "> [!info] ⏳ Gemini is rewriting your note...\n\n";

        // Upgraded regex catches both Wiki-links ![[...]] and standard MD links ![...](...)
        const fileRegex = /!(?:\[\[(.*?)\]\]|\[.*?\]\((.*?)\))/ig;
        let hasFiles = false;
        let embedsToKeep = "";
        let embeddedMarkdown = ""; 
        let match;

        const noInstruction = (!customInstruction || customInstruction.trim() === '');
        const tempMatch = rawText.match(fileRegex);
        const noContent = (rawText.trim() === '' && !tempMatch);

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

        if (action === 'Chat') {
            new obsidian.Notice(`Asking ${this.settings.model}...`);
            parts.push({ text: `User Query: ${customInstruction.trim()}` });
            editor.replaceSelection(insertLoadingText);
        } 
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
                
                // Grab whichever link style the regex found (Wiki or MD)
                const rawLink = match[1] || match[2];
                
                // 1. Split at '|' to remove aliases
                // 2. Split at '#' to remove block/heading references
                // 3. decodeURIComponent to fix standard MD links that use %20 for spaces
                const cleanLink = decodeURIComponent(rawLink.split('|')[0].split('#')[0].trim());
                
                const file = this.app.metadataCache.getFirstLinkpathDest(cleanLink, view.file.path);
                
                if (file) {
                    const extension = file.extension.toLowerCase();

                    // --- EXCALIDRAW IN-MEMORY RENDER (IPAD OS BYPASS) ---
                    const excalidrawPlugin = this.app.plugins.plugins['obsidian-excalidraw-plugin'];
                    if (excalidrawPlugin && excalidrawPlugin.ea && excalidrawPlugin.ea.isExcalidrawFile(file)) {
                        new obsidian.Notice(`Rendering drawing directly from memory: ${file.name}...`);
                        
                        // Force save the active drawing so the text file updates instantly
                        this.app.commands.executeCommandById('obsidian-excalidraw-plugin:save');
                        await new Promise(resolve => setTimeout(resolve, 300));
                        
                        try {
                            const ea = excalidrawPlugin.ea;
                            ea.reset();
                            const scene = await ea.getSceneFromFile(file);
                            
                            if(scene && scene.elements) {
                                ea.copyViewElementsToEAforEditing(scene.elements);
                                
                                // Generate PNG entirely in RAM (Bypasses background saving delay)
                                const blob = await ea.createPNG();
                                const arrayBuffer = await blob.arrayBuffer();
                                const base64 = obsidian.arrayBufferToBase64(arrayBuffer);
                                
                                parts.push({
                                    inlineData: { mimeType: 'image/png', data: base64 }
                                });
                                continue; 
                            }
                        } catch (err) {
                            console.error("Excalidraw Render Error:", err);
                            new obsidian.Notice(`Warning: Failed to render Excalidraw image. Trying text fallback...`);
                        }
                    }

                    // --- BINARY MEDIA PROCESSING ---
                    if (['png', 'jpg', 'jpeg', 'webp', 'heic', 'pdf', 'mp3', 'mp4', 'm4a', 'wav', 'webm'].includes(extension)) {
                        new obsidian.Notice(`Processing media: ${file.name}...`);
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
                    } 
                    // --- TEXT/NOTE TRANSCLUSION ---
                    else if (['md', 'canvas', 'txt'].includes(extension)) {
                        new obsidian.Notice(`Reading embedded text: ${file.name}...`);
                        let embedText = await this.app.vault.read(file);
                        
                        // Strip standard YAML Frontmatter
                        embedText = embedText.replace(/^---[\s\S]*?---\n/m, ''); 
                        
                        embeddedMarkdown += `\n\n--- Content from embedded file: ${file.name} ---\n${embedText.trim()}`;
                    }
                } else {
                    new obsidian.Notice(`Warning: Could not find file '${cleanLink}' in the vault.`);
                }
            }

            const cleanedText = rawText.replace(fileRegex, '').trim();
            
            let promptText = "";
            if (customInstruction && customInstruction.trim() !== '') {
                promptText = `User Instructions: ${customInstruction.trim()}\n\n`;
            } else {
                promptText = `User Instructions: ${this.settings.defaultAction}\n\n`;
            }
            
            promptText += "Source Material:\n" + cleanedText + embeddedMarkdown;

            if (action === 'Insert') {
                promptText += "\n\n(IMPORTANT: The user is inserting your response into their existing note. Do not rewrite or repeat the existing note text above. ONLY output the new content to be inserted.)";
                editor.replaceSelection(insertLoadingText);
            } else if (action === 'Replace') {
                editor.setValue(replaceLoadingText + rawText);
            }

            parts.push({ text: promptText });
        }

        // --- API CALL (STREAMING OVERRIDE) ---
        this.abortController = new AbortController();

        try {
            // We use standard fetch instead of obsidian.requestUrl so we can process the Server-Sent Events stream
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.settings.model}:streamGenerateContent?alt=sse&key=${this.settings.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: this.settings.systemInstruction }] },
                    contents: [{ parts: parts }],
                    generationConfig: { temperature: this.settings.temperature }
                }),
                signal: this.abortController.signal
            });

            if (!response.ok) {
                const errText = await response.text();
                let errorMsg = `API Error ${response.status}`;
                try {
                    const errJson = JSON.parse(errText);
                    if (errJson.error && errJson.error.message) {
                        errorMsg += `: ${errJson.error.message}`;
                    }
                } catch (e) {}
                this.revertLoadingState(editor, action, insertLoadingText, replaceLoadingText);
                new obsidian.Notice(errorMsg);
                this.abortController = null;
                return;
            }

            // --- PREPARE EDITOR FOR REAL-TIME STREAMING ---
            let streamCursor = null;

            if (action === 'Replace') {
                // Wipe the canvas clean (preserving file links if they exist)
                editor.setValue(hasFiles ? embedsToKeep + "\n\n" : "");
                streamCursor = { line: editor.lastLine(), ch: editor.getLine(editor.lastLine()).length };
            } else {
                // For insert/chat, gracefully locate and remove the loading text we just dropped in
                let text = editor.getValue();
                let idx = text.indexOf(insertLoadingText);
                
                if (idx !== -1) {
                    let linesBefore = text.substring(0, idx).split('\n');
                    let startLine = linesBefore.length - 1;
                    let startCh = linesBefore[linesBefore.length - 1].length;

                    let linesLoading = insertLoadingText.split('\n');
                    let endLine = startLine + linesLoading.length - 1;
                    let endCh = (linesLoading.length === 1 ? startCh : 0) + linesLoading[linesLoading.length - 1].length;

                    editor.replaceRange("", {line: startLine, ch: startCh}, {line: endLine, ch: endCh});
                    streamCursor = {line: startLine, ch: startCh};
                    
                    // Drop down two lines so the streaming output has breathing room
                    editor.replaceRange("\n\n", streamCursor);
                    streamCursor.line += 2;
                    streamCursor.ch = 0;
                } else {
                    // Fallback in case they deleted the loading text themselves
                    streamCursor = editor.getCursor();
                }
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let done = false;
            let buffer = "";

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                
                if (value) {
                    buffer += decoder.decode(value, { stream: true });
                    let lines = buffer.split('\n');
                    buffer = lines.pop(); // Hold onto the last chunk in case it got cut off mid-JSON string
                    
                    for (let line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6);
                            if (dataStr.trim() === '[DONE]') continue;
                            
                            try {
                                const data = JSON.parse(dataStr);
                                if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
                                    const chunkText = data.candidates[0].content.parts[0].text;
                                    
                                    if (chunkText) {
                                        // Type the text into Obsidian
                                        editor.replaceRange(chunkText, streamCursor);
                                        
                                        // Dynamically calculate where the cursor needs to move next
                                        let chunkLines = chunkText.split('\n');
                                        if (chunkLines.length === 1) {
                                            streamCursor.ch += chunkLines[0].length;
                                        } else {
                                            streamCursor.line += chunkLines.length - 1;
                                            streamCursor.ch = chunkLines[chunkLines.length - 1].length;
                                        }
                                    }
                                }
                            } catch(err) {
                                // Silently ignore broken JSON chunks; they fix themselves on the next loop iteration
                            }
                        }
                    }
                }
            }
            
            new obsidian.Notice(`Gemini Action completed successfully!`);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                new obsidian.Notice("Gemini processing was successfully cancelled.");
            } else {
                console.error("Gemini API Error:", error);
                this.revertLoadingState(editor, action, insertLoadingText, replaceLoadingText);
                new obsidian.Notice('Network Error: Failed to connect to Google API. Are you connected to the internet?');
            }
        } finally {
            this.abortController = null;
        }
    }

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
