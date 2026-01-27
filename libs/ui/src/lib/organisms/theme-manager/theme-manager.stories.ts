import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ThemeManagerComponent } from './theme-manager.component';
import { ThemeManager } from './theme-manager.service';

const meta: Meta<ThemeManagerComponent> = {
    title: 'Organisms/Theme Manager',
    component: ThemeManagerComponent,
    tags: ['autodocs'],
    decorators: [
        moduleMetadata({
            imports: [ThemeManagerComponent],
            providers: [ThemeManager],
        }),
    ],
    args: {
        themes: [
            { name: 'Light', value: 'light' },
            { name: 'Dark', value: 'dark' },
            { name: 'Auto', value: 'auto' },
        ]
    }
};

export default meta;
type Story = StoryObj<ThemeManagerComponent>;

export const Default: Story = {};
