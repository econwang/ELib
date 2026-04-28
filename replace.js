const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // App structure backgrounds
    content = content.replace(/bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100/g, 'bg-app-bg text-app-text');
    content = content.replace(/bg-gray-50 dark:bg-gray-900/g, 'bg-app-bg');
    content = content.replace(/bg-white dark:bg-gray-900/g, 'bg-app-bg');
    content = content.replace(/bg-gray-100 dark:bg-gray-800/g, 'bg-app-surface');
    content = content.replace(/bg-white dark:bg-gray-800/g, 'bg-app-surface');
    content = content.replace(/bg-gray-200 dark:bg-gray-800/g, 'bg-app-surface');

    // Texts
    content = content.replace(/text-gray-900 dark:text-gray-100/g, 'text-app-text');
    content = content.replace(/text-gray-700 dark:text-gray-300/g, 'text-app-text-muted');
    content = content.replace(/text-gray-600 dark:text-gray-400/g, 'text-app-text-muted');
    content = content.replace(/text-gray-600 dark:text-gray-300/g, 'text-app-text-muted');
    content = content.replace(/text-gray-500 dark:text-gray-400/g, 'text-app-text-muted');
    content = content.replace(/text-gray-400 dark:text-gray-500/g, 'text-app-text-muted');
    content = content.replace(/text-gray-500/g, 'text-app-text-muted');
    content = content.replace(/text-gray-400/g, 'text-app-text-muted');

    // Borders
    content = content.replace(/border-gray-300 dark:border-gray-700/g, 'border-app-border');
    content = content.replace(/border-gray-200 dark:border-gray-700/g, 'border-app-border');
    content = content.replace(/border-gray-100 dark:border-gray-800/g, 'border-app-border');

    fs.writeFileSync(filePath, content, 'utf8');
}

['App.vue', 'components/BookTable.vue', 'components/BookDetail.vue', 'components/TreeView.vue'].forEach(file => {
    replaceInFile(path.join('/workspace/e-lib-pro/src', file));
});
