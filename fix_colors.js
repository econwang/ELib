const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

// App.vue
replaceInFile('/workspace/e-lib-pro/src/App.vue', [
    [/<header class="h-8 bg-app-surface/g, '<header class="h-8 bg-app-panel'],
    [/class="bg-app-surface overflow-y-auto shrink-0 font-ui"/g, 'class="bg-app-panel overflow-y-auto shrink-0 font-ui"'],
    [/class="bg-app-bg overflow-auto shrink-0 relative"/g, 'class="bg-app-surface overflow-auto shrink-0 relative"'],
    [/class="absolute inset-0 flex items-center justify-center text-app-text-muted bg-app-bg z-20"/g, 'class="absolute inset-0 flex items-center justify-center text-app-text-muted bg-app-surface z-20"'],
    [/class="flex-1 bg-app-bg overflow-y-auto p-4 min-h-0"/g, 'class="flex-1 bg-app-bg overflow-y-auto p-4 min-h-0"'], // already bg-app-bg
    [/bgLight: '#f9fafb',/g, "bgLight: '#f9fafb',\n  panelLight: '#f3f4f6',"],
    [/bgDark: '#111827',/g, "bgDark: '#111827',\n  panelDark: '#1f2937',"],
    [/textMutedLight: '#6b7280',/g, "textMutedLight: '#4b5563',"],
    [/borderLight: '#d1d5db',/g, "borderLight: '#e5e7eb',"],
    [/'--config-bg': config.value.darkMode \? config.value.bgDark : config.value.bgLight,/g, "'--config-bg': config.value.darkMode ? config.value.bgDark : config.value.bgLight,\n    '--config-panel': config.value.darkMode ? config.value.panelDark : config.value.panelLight,"],
    [/if \(conf.bgDark !== undefined\) config.value.bgDark = conf.bgDark;/g, "if (conf.bgDark !== undefined) config.value.bgDark = conf.bgDark;\n    if (conf.panelLight !== undefined) config.value.panelLight = conf.panelLight;\n    if (conf.panelDark !== undefined) config.value.panelDark = conf.panelDark;"],
    [/<label class="flex justify-between items-center text-sm"><span>Surface<\/span> <input type="color" v-model="config.surfaceLight" @change="applyConfig"><\/label>/g, '<label class="flex justify-between items-center text-sm"><span>Panel</span> <input type="color" v-model="config.panelLight" @change="applyConfig"></label>\n                <label class="flex justify-between items-center text-sm"><span>Surface</span> <input type="color" v-model="config.surfaceLight" @change="applyConfig"></label>'],
    [/<label class="flex justify-between items-center text-sm"><span>Surface<\/span> <input type="color" v-model="config.surfaceDark" @change="applyConfig"><\/label>/g, '<label class="flex justify-between items-center text-sm"><span>Panel</span> <input type="color" v-model="config.panelDark" @change="applyConfig"></label>\n                <label class="flex justify-between items-center text-sm"><span>Surface</span> <input type="color" v-model="config.surfaceDark" @change="applyConfig"></label>']
]);

// style.css
replaceInFile('/workspace/e-lib-pro/src/style.css', [
    [/--color-app-surface: var\(--config-surface\);/g, '--color-app-surface: var(--config-surface);\n  --color-app-panel: var(--config-panel);']
]);

// BookTable.vue
replaceInFile('/workspace/e-lib-pro/src/components/BookTable.vue', [
    [/<thead class="bg-app-surface sticky top-0 shadow-sm z-10">/g, '<thead class="bg-app-panel sticky top-0 shadow-sm z-10">']
]);

