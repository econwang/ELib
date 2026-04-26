const fs = require('fs');

const content = fs.readFileSync('/workspace/e-lib-pro/src/App.vue', 'utf-8');

// Replace the splitpanes template with a custom resizer layout
let newTemplate = content.replace(
  /<div class="flex-1 overflow-hidden" @click="closeContextMenu">[\s\S]*?<\/splitpanes>\s*<\/div>/,
  `
    <!-- Main Content Resizable Panes -->
    <div class="flex-1 flex overflow-hidden" @click="closeContextMenu" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag">
      
      <!-- Left Pane (TreeView) -->
      <div :style="{ width: leftPaneWidth + 'px' }" class="bg-gray-100 dark:bg-gray-800 overflow-y-auto shrink-0">
        <div class="p-2 h-full" @contextmenu.prevent="onPaneContextMenu">
          <div v-for="db in store.databases" :key="db" class="mb-4">
            <div class="font-bold cursor-pointer hover:text-[var(--color-primary)] p-1 rounded transition-colors" :class="{'bg-gray-200 dark:bg-gray-700': store.currentDb === db}" @click="selectDb(db)" @contextmenu.stop.prevent="onDbContextMenu($event, db)">
              🗄️ {{ db }}
            </div>
            <TreeView v-if="store.currentDb === db" :nodes="buildTree(store.categories)" @select="onCategorySelect" @contextmenu="onCategoryContextMenu" />
          </div>
          
          <div v-if="store.databases.length === 0" class="text-gray-500 text-sm p-4 text-center mt-10">
            No databases found.<br/>Right-click to create one.
          </div>
        </div>
      </div>
      
      <!-- Vertical Resizer -->
      <div class="w-1 cursor-col-resize hover:bg-[var(--color-primary)] bg-gray-300 dark:bg-gray-700 z-10 transition-colors" @mousedown="startDrag('vertical')"></div>

      <!-- Right Pane (Table + Details) -->
      <div class="flex-1 flex flex-col min-w-0">
        
        <!-- Top Right Pane (Table) -->
        <div :style="{ height: topPaneHeight + 'px' }" class="bg-white dark:bg-gray-900 overflow-auto shrink-0">
          <BookTable :books="store.books" @select="store.selectBook" />
        </div>
        
        <!-- Horizontal Resizer -->
        <div class="h-1 cursor-row-resize hover:bg-[var(--color-primary)] bg-gray-300 dark:bg-gray-700 z-10 transition-colors" @mousedown="startDrag('horizontal')"></div>

        <!-- Bottom Right Pane (Details) -->
        <div class="flex-1 bg-gray-50 dark:bg-gray-800 overflow-y-auto p-4 min-h-0">
          <BookDetail :book="store.selectedBook" :cover="store.bookCover" />
        </div>
        
      </div>
    </div>
  `
);

// Remove splitpanes imports
newTemplate = newTemplate.replace(/import \{ Splitpanes, Pane \} from 'splitpanes';\n/, '');
newTemplate = newTemplate.replace(/import 'splitpanes\/dist\/splitpanes\.css';\n/, '');

// Add custom resizer logic
const scriptInjection = `
// Custom Resizer Logic
const leftPaneWidth = ref(300);
const topPaneHeight = ref(400);
const dragging = ref<'vertical' | 'horizontal' | null>(null);

const startDrag = (type: 'vertical' | 'horizontal') => {
  dragging.value = type;
  document.body.style.userSelect = 'none'; // Prevent text selection while dragging
};

const onDrag = (e: MouseEvent) => {
  if (dragging.value === 'vertical') {
    leftPaneWidth.value = Math.max(150, Math.min(e.clientX, window.innerWidth - 300));
  } else if (dragging.value === 'horizontal') {
    // 32 is the height of the header
    topPaneHeight.value = Math.max(100, Math.min(e.clientY - 32, window.innerHeight - 150));
  }
};

const stopDrag = () => {
  if (dragging.value) {
    dragging.value = null;
    document.body.style.userSelect = '';
  }
};
`;

newTemplate = newTemplate.replace(/const store = useLibraryStore\(\);/, 'const store = useLibraryStore();\n' + scriptInjection);

// Remove splitpanes styles
newTemplate = newTemplate.replace(/<style>[\s\S]*?<\/style>/, '');

fs.writeFileSync('/workspace/e-lib-pro/src/App.vue', newTemplate);

// Clean up vite.config.ts and package.json
const viteConfig = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
`;
fs.writeFileSync('/workspace/e-lib-pro/vite.config.ts', viteConfig);

