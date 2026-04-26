const fs = require('fs');

const appVue = `
<template>
  <div class="h-screen w-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200" :style="customStyle">
    <!-- Menu Bar -->
    <header class="h-8 bg-gray-200 dark:bg-gray-800 flex items-center px-4 space-x-4 text-sm select-none border-b border-gray-300 dark:border-gray-700 shrink-0">
      <div class="relative group">
        <div class="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 px-2 py-1 rounded">File</div>
        <div class="absolute hidden group-hover:block top-full left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg py-1 z-50 w-48">
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="showCreateDb = true">Create New Database</div>
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="showOpenDb = true">Open Existing Database</div>
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="exportBibtex">Export BibTeX</div>
        </div>
      </div>
      <div class="relative group">
        <div class="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 px-2 py-1 rounded">Edit</div>
        <div class="absolute hidden group-hover:block top-full left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg py-1 z-50 w-48">
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="openAddBookModal">Add New Book</div>
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="showAddCategory = true">Add Category</div>
        </div>
      </div>
      <div class="relative group">
        <div class="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 px-2 py-1 rounded">View</div>
        <div class="absolute hidden group-hover:block top-full left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg py-1 z-50 w-48">
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="showConfig = true">GUI Config Editor</div>
        </div>
      </div>
    </header>

    <!-- Main Content Splitpanes -->
    <div class="flex-1 overflow-hidden" @click="closeContextMenu">
      <splitpanes class="default-theme">
        <pane size="25" min-size="15" class="bg-gray-100 dark:bg-gray-800 overflow-y-auto">
          <div class="p-2 h-full">
            <div v-for="db in store.databases" :key="db" class="mb-4">
              <div class="font-bold cursor-pointer hover:text-[var(--color-primary)]" @click="selectDb(db)" @contextmenu.prevent="onDbContextMenu($event, db)">
                🗄️ {{ db }}
              </div>
              <TreeView v-if="store.currentDb === db" :nodes="buildTree(store.categories)" @select="onCategorySelect" @contextmenu="onCategoryContextMenu" />
            </div>
          </div>
        </pane>
        
        <pane size="75" min-size="30">
          <splitpanes horizontal>
            <pane size="70" min-size="20" class="bg-white dark:bg-gray-900">
              <BookTable :books="store.books" @select="store.selectBook" />
            </pane>
            <pane size="30" min-size="10" class="bg-gray-50 dark:bg-gray-800 overflow-y-auto">
              <BookDetail :book="store.selectedBook" :cover="store.bookCover" />
            </pane>
          </splitpanes>
        </pane>
      </splitpanes>
    </div>

    <!-- Context Menu -->
    <div v-if="contextMenu.show" :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }" class="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg py-1 z-[100] w-48 text-sm">
      <div class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="handleContextMenu('addBook')">Add Book to Category</div>
      <div class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="handleContextMenu('addCategory')">Add Sub-category</div>
    </div>

    <!-- Modals -->
    <div v-if="showConfig" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
        <h2 class="text-xl mb-4">Configuration</h2>
        <div class="space-y-3">
          <label class="flex items-center space-x-2">
            <input type="checkbox" v-model="config.darkMode" @change="applyConfig" />
            <span>Dark Mode</span>
          </label>
          <label class="flex flex-col space-y-1">
            <span>Primary Color</span>
            <input type="color" v-model="config.primaryColor" @change="applyConfig" class="w-full h-8 cursor-pointer" />
          </label>
          <label class="flex flex-col space-y-1">
            <span>Font Size (px)</span>
            <input type="number" v-model="config.fontSize" @change="applyConfig" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          </label>
        </div>
        <div class="flex justify-end space-x-2 mt-6">
          <button @click="showConfig = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Close</button>
          <button @click="saveConfig" class="px-4 py-2 rounded bg-[var(--color-primary)] text-white">Save</button>
        </div>
      </div>
    </div>

    <!-- DB Modals -->
    <div v-if="showCreateDb" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
        <h2 class="text-xl mb-4">Create Database</h2>
        <input v-model="dbName" placeholder="Database Name" class="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
        <input v-model="dbPath" placeholder="Path (e.g., C:/data.db)" class="w-full mb-4 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
        <div class="flex justify-end space-x-2">
          <button @click="showCreateDb = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          <button @click="doCreateDb" class="px-4 py-2 rounded bg-blue-500 text-white">Create</button>
        </div>
      </div>
    </div>

    <div v-if="showOpenDb" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
        <h2 class="text-xl mb-4">Open Database</h2>
        <input v-model="dbName" placeholder="Database Name" class="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
        <input v-model="dbPath" placeholder="Path (e.g., C:/data.db)" class="w-full mb-4 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
        <div class="flex justify-end space-x-2">
          <button @click="showOpenDb = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          <button @click="doOpenDb" class="px-4 py-2 rounded bg-blue-500 text-white">Open</button>
        </div>
      </div>
    </div>

    <!-- Category Modal -->
    <div v-if="showAddCategory" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
        <h2 class="text-xl mb-4">Add Category</h2>
        <p class="mb-2 text-sm text-gray-500" v-if="contextMenu.nodeId">Parent: {{ contextMenu.nodeName }}</p>
        <p class="mb-2 text-sm text-gray-500" v-else>Parent: Root</p>
        <input v-model="categoryName" @keyup.enter="doAddCategory" placeholder="Category Name" class="w-full mb-4 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
        <div class="flex justify-end space-x-2">
          <button @click="showAddCategory = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          <button @click="doAddCategory" class="px-4 py-2 rounded bg-[var(--color-primary)] text-white">Add</button>
        </div>
      </div>
    </div>

    <!-- Add Book Modal -->
    <div v-if="showAddBook" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-[500px] max-h-screen overflow-y-auto">
        <h2 class="text-xl mb-4">Add New Book</h2>
        <div class="space-y-3">
          <input v-model="bookForm.title" placeholder="Title" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <input v-model="bookForm.author" placeholder="Author" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <input v-model="bookForm.publisher" placeholder="Publisher" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <input v-model="bookForm.isbn" placeholder="ISBN" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <input v-model="bookForm.edition" placeholder="Edition" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <input v-model="bookForm.local_path" placeholder="Local Path" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <textarea v-model="bookForm.notes" placeholder="Notes" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 h-20"></textarea>
          
          <div class="border border-dashed border-gray-400 p-4 text-center rounded">
            <label class="cursor-pointer block">
              <span class="text-blue-500">Upload Cover Image</span>
              <input type="file" accept="image/*" @change="onCoverChange" class="hidden" />
            </label>
            <div v-if="bookForm.coverName" class="text-xs text-gray-500 mt-2">{{ bookForm.coverName }}</div>
          </div>
          
          <div class="border border-dashed border-gray-400 p-4 text-center rounded">
            <textarea v-model="bookForm.bibtex" placeholder="Or paste BibTeX here to import" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm h-24"></textarea>
          </div>
        </div>
        
        <div class="flex justify-end space-x-2 mt-4">
          <button @click="showAddBook = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          <button @click="doAddBook" class="px-4 py-2 rounded bg-[var(--color-primary)] text-white">Add</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useLibraryStore } from './store';
import TreeView from './components/TreeView.vue';
import BookTable from './components/BookTable.vue';
import BookDetail from './components/BookDetail.vue';
import { invoke } from '@tauri-apps/api/core';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';

const store = useLibraryStore();

const showCreateDb = ref(false);
const showOpenDb = ref(false);
const showAddBook = ref(false);
const showAddCategory = ref(false);
const dbName = ref('');
const dbPath = ref('');
const categoryName = ref('');

const showConfig = ref(false);
const config = ref({ darkMode: false, primaryColor: '#3b82f6', fontSize: 14 });

const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  nodeId: null as number | null,
  nodeName: ''
});

const customStyle = computed(() => {
  return {
    '--color-primary': config.value.primaryColor,
    'font-size': config.value.fontSize + 'px'
  }
});

onMounted(async () => {
  store.loadDatabases();
  try {
    const confStr = await invoke('read_config');
    const conf = JSON.parse(confStr as string);
    if (conf.darkMode !== undefined) config.value.darkMode = conf.darkMode;
    if (conf.primaryColor !== undefined) config.value.primaryColor = conf.primaryColor;
    if (conf.fontSize !== undefined) config.value.fontSize = conf.fontSize;
    applyConfig();
  } catch (e) {}
});

const applyConfig = () => {
  if (config.value.darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const saveConfig = async () => {
  await invoke('save_config', { config: JSON.stringify(config.value) });
  showConfig.value = false;
};

const selectDb = (db: string) => {
  store.currentDb = db;
  store.fetchCategories();
  store.fetchBooks(null);
};

const onCategorySelect = (node: any) => {
  store.fetchBooks(node.id);
};

// Context Menu Logic
const closeContextMenu = () => {
  contextMenu.value.show = false;
};

const onDbContextMenu = (event: MouseEvent, db: string) => {
  event.preventDefault();
  store.currentDb = db;
  store.fetchCategories();
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    nodeId: null,
    nodeName: db
  };
};

const onCategoryContextMenu = ({ event, node }: any) => {
  event.preventDefault();
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    nodeId: node.id,
    nodeName: node.name
  };
};

const handleContextMenu = (action: string) => {
  if (action === 'addCategory') {
    categoryName.value = '';
    showAddCategory.value = true;
  } else if (action === 'addBook') {
    openAddBookModal();
  }
  closeContextMenu();
};

const doAddCategory = async () => {
  if (categoryName.value.trim()) {
    await store.addCategory(contextMenu.value.nodeId, categoryName.value.trim());
    categoryName.value = '';
    showAddCategory.value = false;
  }
};

const doCreateDb = async () => {
  await store.createDatabase(dbName.value, dbPath.value);
  showCreateDb.value = false;
};

const doOpenDb = async () => {
  await store.openDatabase(dbName.value, dbPath.value);
  showOpenDb.value = false;
};

const exportBibtex = async () => {
  if (!store.currentDb) return;
  try {
    const bib = await invoke('export_bibtex', { dbName: store.currentDb, categoryId: null });
    
    // Create a Blob and trigger download in browser
    const blob = new Blob([bib as string], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library_export.bib';
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
  }
};

// Add Book Logic
const bookForm = ref({
  title: '', author: '', publisher: '', isbn: '', edition: '', local_path: '', notes: '', bibtex: '', coverBytes: [] as number[], coverName: ''
});

const openAddBookModal = () => {
  bookForm.value = { title: '', author: '', publisher: '', isbn: '', edition: '', local_path: '', notes: '', bibtex: '', coverBytes: [], coverName: '' };
  showAddBook.value = true;
};

const onCoverChange = (e: any) => {
  const file = e.target.files[0];
  if (file) {
    bookForm.value.coverName = file.name;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target && ev.target.result) {
        const buffer = new Uint8Array(ev.target.result as ArrayBuffer);
        bookForm.value.coverBytes = Array.from(buffer);
      }
    };
    reader.readAsArrayBuffer(file);
  }
};

const doAddBook = async () => {
  if (!store.currentDb) return;
  const targetCategory = contextMenu.value.nodeId; // Add to selected category from context menu or root
  
  if (bookForm.value.bibtex.trim() !== '') {
    await invoke('import_bibtex', { 
      dbName: store.currentDb, 
      categoryId: targetCategory, 
      bibtexContent: bookForm.value.bibtex 
    });
  } else {
    await invoke('add_book', {
      dbName: store.currentDb,
      categoryId: targetCategory,
      title: bookForm.value.title,
      author: bookForm.value.author,
      publisher: bookForm.value.publisher,
      isbn: bookForm.value.isbn,
      edition: bookForm.value.edition,
      localPath: bookForm.value.local_path,
      coverBytes: bookForm.value.coverBytes,
      notes: bookForm.value.notes
    });
  }
  
  showAddBook.value = false;
  store.fetchBooks(targetCategory);
};

const buildTree = (categories: any[]) => {
  const map = new Map();
  const roots: any[] = [];
  categories.forEach(c => map.set(c.id, { ...c, children: [] }));
  categories.forEach(c => {
    if (c.parent_id) {
      const parent = map.get(c.parent_id);
      if (parent) parent.children.push(map.get(c.id));
    } else {
      roots.push(map.get(c.id));
    }
  });
  return roots;
};
</script>

<style>
/* Splitpanes Theme Customization */
.splitpanes__pane {
  display: flex;
  flex-direction: column;
}
.splitpanes__splitter {
  background-color: var(--color-border, #e5e7eb);
  position: relative;
}
.dark .splitpanes__splitter {
  background-color: var(--color-border-dark, #374151);
}
.splitpanes__splitter:before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  transition: opacity 0.4s;
  background-color: var(--color-primary, #3b82f6);
  opacity: 0;
  z-index: 1;
}
.splitpanes__splitter:hover:before {
  opacity: 1;
}
.splitpanes--vertical > .splitpanes__splitter:before {
  left: -2px;
  right: -2px;
  height: 100%;
}
.splitpanes--horizontal > .splitpanes__splitter:before {
  top: -2px;
  bottom: -2px;
  width: 100%;
}
</style>
`;

fs.writeFileSync('/workspace/e-lib-pro/src/App.vue', appVue.trim());
