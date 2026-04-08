import {
    Box,
    Text
} from 'ink';
import React from 'react';

import type { Settings } from '../../types/Settings';
import { type PowerlineFontStatus } from '../../utils/powerline';

import { List } from './List';

export type MainMenuOption = 'lines'
    | 'colors'
    | 'powerline'
    | 'terminalConfig'
    | 'globalOverrides'
    | 'install'
    | 'save'
    | 'exit';

export interface MainMenuProps {
    onSelect: (value: MainMenuOption, index: number) => void;
    isCopilotInstalled: boolean;
    hasChanges: boolean;
    initialSelection?: number;
    powerlineFontStatus: PowerlineFontStatus;
    settings: Settings | null;
    previewIsTruncated?: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({
    onSelect,
    isCopilotInstalled,
    hasChanges,
    initialSelection = 0,
    powerlineFontStatus,
    settings,
    previewIsTruncated
}) => {
    const menuItems: ({
        label: string;
        value: MainMenuOption;
        description: string;
    } | '-')[] = [
        {
            label: '📝 Edit Lines',
            value: 'lines',
            description:
                'Configure status lines with widgets like model info, git status, token usage, and premium requests'
        },
        {
            label: '🎨 Edit Colors',
            value: 'colors',
            description:
                'Customize colors for each widget including foreground, background, and bold styling'
        },
        {
            label: '⚡ Powerline Setup',
            value: 'powerline',
            description:
                'Install Powerline fonts for enhanced visual separators and symbols'
        },
        '-' as const,
        {
            label: '💻 Terminal Options',
            value: 'terminalConfig',
            description: 'Configure terminal-specific settings for optimal display'
        },
        {
            label: '🌐 Global Overrides',
            value: 'globalOverrides',
            description:
                'Set global padding, separators, and color overrides that apply to all widgets'
        },
        '-' as const,
        {
            label: isCopilotInstalled
                ? '🔌 Uninstall from Copilot CLI'
                : '📦 Install to Copilot CLI',
            value: 'install',
            description: isCopilotInstalled
                ? 'Remove copilot-statusline from your Copilot CLI config'
                : 'Add copilot-statusline to your Copilot CLI config (~/.copilot/config.json)'
        }
    ];

    if (hasChanges) {
        menuItems.push(
            {
                label: '💾 Save & Exit',
                value: 'save',
                description: 'Save all changes and exit the configuration tool'
            },
            {
                label: '❌ Exit without saving',
                value: 'exit',
                description: 'Exit without saving your changes'
            }
        );
    } else {
        menuItems.push(
            {
                label: '🚪 Exit',
                value: 'exit',
                description: 'Exit the configuration tool'
            }
        );
    }

    const showTruncationWarning
        = previewIsTruncated && settings?.flexMode === 'full-minus-40';

    return (
        <Box flexDirection='column'>
            {showTruncationWarning && (
                <Box marginBottom={1}>
                    <Text color='yellow'>
                        ⚠ Some lines are truncated, see Terminal Options → Terminal Width
                        for info
                    </Text>
                </Box>
            )}

            <Text bold>Main Menu</Text>

            <List
                items={menuItems}
                marginTop={1}
                onSelect={(value, index) => {
                    if (value === 'back') {
                        return;
                    }

                    onSelect(value, index);
                }}
                initialSelection={initialSelection}
            />
        </Box>
    );
};