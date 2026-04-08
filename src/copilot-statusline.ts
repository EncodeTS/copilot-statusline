#!/usr/bin/env node
import chalk from 'chalk';

import { runTUI } from './tui';
import type { CopilotPayload } from './types/CopilotPayload';
import { CopilotPayloadSchema } from './types/CopilotPayload';
import type { RenderContext } from './types/RenderContext';
import { getVisibleText } from './utils/ansi';
import { updateColorMap } from './utils/colors';
import {
    initConfigPath,
    loadSettings,
    saveSettings
} from './utils/config';
import { advanceGlobalPowerlineThemeIndex } from './utils/powerline-theme-index';
import {
    calculateMaxWidthsFromPreRendered,
    preRenderAllWidgets,
    renderStatusLine
} from './utils/renderer';
import { advanceGlobalSeparatorIndex } from './utils/separator-index';

async function readStdin(): Promise<string | null> {
    if (process.stdin.isTTY) {
        return null;
    }

    // Use synchronous read to capture stdin before Copilot CLI closes the pipe.
    // Copilot CLI writes JSON and closes stdin very quickly — async approaches
    // (for-await on stdin stream) may miss data because the runtime hasn't
    // finished initializing by the time EOF arrives.
    try {
        const fs = await import('fs');
        const data = fs.readFileSync(0, 'utf-8');
        return data.length > 0 ? data : null;
    } catch {
        // Fallback to async read (e.g. if fd 0 sync read fails on some platform)
        const chunks: string[] = [];
        try {
            if (typeof Bun !== 'undefined') {
                const decoder = new TextDecoder();
                for await (const chunk of Bun.stdin.stream()) {
                    chunks.push(decoder.decode(chunk));
                }
            } else {
                process.stdin.setEncoding('utf8');
                for await (const chunk of process.stdin) {
                    chunks.push(chunk as string);
                }
            }
            return chunks.join('') || null;
        } catch {
            return null;
        }
    }
}

async function ensureWindowsUtf8CodePage() {
    if (process.platform !== 'win32') {
        return;
    }

    try {
        const { execFileSync } = await import('child_process');
        execFileSync('chcp.com', ['65001'], { stdio: 'ignore' });
    } catch {
        // Ignore failures
    }
}

async function renderMultipleLines(data: CopilotPayload) {
    const settings = await loadSettings();

    chalk.level = settings.colorLevel;
    updateColorMap();

    const lines = settings.lines;

    const context: RenderContext = {
        data,
        isPreview: false,
        minimalist: settings.minimalistMode
    };

    const preRenderedLines = preRenderAllWidgets(lines, settings, context);
    const preCalculatedMaxWidths = calculateMaxWidthsFromPreRendered(preRenderedLines, settings);

    let globalSeparatorIndex = 0;
    let globalPowerlineThemeIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        const lineItems = lines[i];
        if (lineItems && lineItems.length > 0) {
            const preRenderedWidgets = preRenderedLines[i] ?? [];
            const lineContext = {
                ...context,
                lineIndex: i,
                globalSeparatorIndex,
                globalPowerlineThemeIndex
            };
            const line = renderStatusLine(lineItems, settings, lineContext, preRenderedWidgets, preCalculatedMaxWidths);

            const strippedLine = getVisibleText(line).trim();
            if (strippedLine.length > 0) {
                let outputLine = line.replace(/ /g, '\u00A0');
                outputLine = '\x1b[0m' + outputLine;
                console.log(outputLine);

                globalSeparatorIndex = advanceGlobalSeparatorIndex(globalSeparatorIndex, lineItems);
                if (settings.powerline.enabled && settings.powerline.continueThemeAcrossLines) {
                    globalPowerlineThemeIndex = advanceGlobalPowerlineThemeIndex(globalPowerlineThemeIndex, preRenderedWidgets);
                }
            }
        }
    }

    if (settings.updatemessage?.message
        && settings.updatemessage.message.trim() !== ''
        && settings.updatemessage.remaining
        && settings.updatemessage.remaining > 0) {
        console.log(settings.updatemessage.message);

        const newRemaining = settings.updatemessage.remaining - 1;

        if (newRemaining <= 0) {
            const { updatemessage, ...newSettings } = settings;
            void updatemessage;
            await saveSettings(newSettings);
        } else {
            await saveSettings({
                ...settings,
                updatemessage: {
                    ...settings.updatemessage,
                    remaining: newRemaining
                }
            });
        }
    }
}

function parseConfigArg(): string | undefined {
    const idx = process.argv.indexOf('--config');
    if (idx === -1)
        return undefined;
    const configPath = process.argv[idx + 1];
    if (!configPath || configPath.startsWith('--')) {
        console.error('--config requires a file path argument');
        process.exit(1);
    }
    process.argv.splice(idx, 2);
    return configPath;
}

async function main() {
    initConfigPath(parseConfigArg());

    if (!process.stdin.isTTY) {
        await ensureWindowsUtf8CodePage();

        const input = await readStdin();
        if (input && input.trim() !== '') {
            try {
                const result = CopilotPayloadSchema.safeParse(JSON.parse(input));
                if (!result.success) {
                    console.error('Invalid Copilot payload format:', result.error.message);
                    process.exit(1);
                }

                await renderMultipleLines(result.data);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                process.exit(1);
            }
        } else {
            console.error('No input received');
            process.exit(1);
        }
    } else {
        // Interactive mode - TUI
        const settings = await loadSettings();
        if (settings.updatemessage) {
            const { updatemessage, ...newSettings } = settings;
            void updatemessage;
            await saveSettings(newSettings);
        }
        runTUI();
    }
}

void main();