const fs = require('fs');

// 1. UPDATE STORE.TS
const storeTs = `
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'

export interface DatabaseInfo {
  id: string;
  path: string;
  description: string;
}

export const useLibraryStore = defineStore('library', () => {
  const databases = ref<DatabaseInfo[]>([])
  const currentDb = ref<string | null>(null)
  const categories = ref<any[]>([])
  const books = ref<any[]>([])
  const selectedBook = ref<any>(null)
  const bookCover = ref<string | null>(null)
  
  const loadDatabases = async () => {
    const saved = localStorage.getItem('elib_dbs')
    if (saved) {
      const parsed = JSON.parse(saved);
      databases.value = parsed.map((d: any) => typeof d === 'string' ? { id: d, path: d + '.db', description: d } : d);
      if (databases.value.length > 0) {
        await openDatabase(databases.value[0].path)
      }
    } else {
      await createDatabase('Default Library', 'default.db')
    }
  }

  const saveDatabases = () => {
    localStorage.setItem('elib_dbs', JSON.stringify(databases.value))
  }

  const openDatabase = async (path: string) => {
    try {
      await invoke('open_db', { dbName: path, path })
      const desc = await invoke('get_db_description', { dbName: path }) as string;
      if (!databases.value.find(d => d.id === path)) {
        databases.value.push({ id: path, path, description: desc })
        saveDatabases()
      }
      currentDb.value = path
      await fetchCategories()
      await fetchBooks(null)
    } catch (e) {
      console.error(e)
    }
  }

  const createDatabase = async (description: string, path: string) => {
    try {
      await invoke('create_db', { dbName: path, path, description })
      if (!databases.value.find(d => d.id === path)) {
        databases.value.push({ id: path, path, description })
        saveDatabases()
      }
      currentDb.value = path
      await fetchCategories()
      await fetchBooks(null)
    } catch (e) {
      console.error(e)
    }
  }

  const closeDatabase = async (id: string) => {
    try {
      await invoke('close_db', { dbName: id });
      databases.value = databases.value.filter(d => d.id !== id);
      saveDatabases();
      if (currentDb.value === id) {
        currentDb.value = null;
        categories.value = [];
        books.value = [];
        selectedBook.value = null;
        bookCover.value = null;
        if (databases.value.length > 0) {
          await openDatabase(databases.value[0].path);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  const fetchCategories = async () => {
    if (!currentDb.value) return
    try {
      categories.value = await invoke('get_categories', { dbName: currentDb.value })
    } catch (e) {
      console.error(e)
    }
  }

  const getCategoryLevel = (parentId: number | null): number => {
    if (!parentId) return 1;
    const parent = categories.value.find(c => c.id === parentId);
    if (!parent) return 1;
    return (parent.level || 1) + 1;
  }

  const addCategory = async (parentId: number | null, name: string) => {
    if (!currentDb.value) return
    const level = getCategoryLevel(parentId);
    if (level > 5) {
      alert('Maximum category depth (5 levels) reached.');
      return;
    }
    try {
      await invoke('add_category', { dbName: currentDb.value, parentId, name, level })
      await fetchCategories()
    } catch (e) {
      console.error(e)
    }
  }

  const fetchBooks = async (categoryId: number | null) => {
    if (!currentDb.value) return
    try {
      books.value = await invoke('get_books', { dbName: currentDb.value, categoryId })
    } catch (e) {
      console.error(e)
    }
  }

  const selectBook = async (book: any) => {
    selectedBook.value = book
    if (book && currentDb.value) {
      try {
        bookCover.value = await invoke('get_book_cover', { dbName: currentDb.value, bookId: book.id })
      } catch (e) {
        console.error(e)
      }
    } else {
      bookCover.value = null
    }
  }

  return {
    databases, currentDb, categories, books, selectedBook, bookCover,
    loadDatabases, openDatabase, createDatabase, closeDatabase, fetchCategories, fetchBooks, selectBook, addCategory
  }
})
`;
fs.writeFileSync('/workspace/e-lib-pro/src/store.ts', storeTs.trim());

// 2. UPDATE TREEVIEW.VUE
const treeViewVue = `
<template>
  <ul class="pl-4 border-l border-gray-300 dark:border-gray-600 ml-2 relative">
    <li v-for="node in nodes" :key="node.id" class="my-1 relative">
      <div class="absolute w-3 border-t border-gray-300 dark:border-gray-600 top-3 -left-4"></div>
      
      <div class="flex items-center space-x-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded group transition-colors"
           @click.stop="toggleNode(node)"
           @contextmenu.stop.prevent="$emit('contextmenu', { event: $event, node })">
        
        <svg v-if="node.children && node.children.length" 
             class="w-3 h-3 text-gray-500 transition-transform" 
             :class="{ 'rotate-90': node.isOpen }"
             fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span v-else class="w-3 h-3 inline-block"></span>
        
        <svg class="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span class="text-sm truncate select-none text-gray-800 dark:text-gray-200">{{ node.name }}</span>
      </div>
      
      <div v-show="node.isOpen">
        <TreeView v-if="node.children && node.children.length" 
                  :nodes="node.children" 
                  @select="$emit('select', $event)" 
                  @contextmenu="$emit('contextmenu', $event)" />
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{ nodes: any[] }>();
const emit = defineEmits(['select', 'contextmenu']);

const toggleNode = (node: any) => {
  node.isOpen = node.isOpen === undefined ? true : !node.isOpen;
  emit('select', node);
};
</script>
`;
fs.writeFileSync('/workspace/e-lib-pro/src/components/TreeView.vue', treeViewVue.trim());

// 3. UPDATE APP.VUE
let appVue = fs.readFileSync('/workspace/e-lib-pro/src/App.vue', 'utf-8');

// Replace DB Loop rendering in Sidebar
appVue = appVue.replace(
  /<div v-for="db in store\.databases" :key="db" class="mb-4">[\s\S]*?<\/div>\s*<\/div>/,
  `<div v-for="db in store.databases" :key="db.id" class="mb-2 select-none">
            <div class="flex items-center space-x-2 font-bold cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 p-1.5 rounded transition-colors" 
                 :class="{'bg-gray-200 dark:bg-gray-700': store.currentDb === db.id}" 
                 @click="selectDb(db)" 
                 @contextmenu.stop.prevent="onDbContextMenu($event, db)">
              <svg class="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              <span class="truncate">{{ db.description }}</span>
            </div>
            <div v-show="store.currentDb === db.id" class="mt-1">
              <TreeView :nodes="buildTree(store.categories)" @select="onCategorySelect" @contextmenu="onCategoryContextMenu" />
            </div>
          </div>`
);

// Update DB Modals
appVue = appVue.replace(
  /<!-- DB Modals -->[\s\S]*?<!-- Category Modal -->/,
  `<!-- DB Modals -->
    <div v-if="showCreateDb" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
        <h2 class="text-xl mb-4">Create Database</h2>
        <input v-model="dbDescription" placeholder="Database Description (e.g., My Library)" class="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
        <div class="flex items-center space-x-2 mb-4">
          <input v-model="dbPath" placeholder="Select save location..." readonly class="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 cursor-not-allowed" />
          <button @click="selectSavePath" class="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Browse</button>
        </div>
        <div class="flex justify-end space-x-2">
          <button @click="showCreateDb = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          <button @click="doCreateDb" class="px-4 py-2 rounded bg-[var(--color-primary)] text-white" :disabled="!dbDescription || !dbPath">Create</button>
        </div>
      </div>
    </div>

    <div v-if="showOpenDb" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
        <h2 class="text-xl mb-4">Open Database</h2>
        <div class="flex items-center space-x-2 mb-4">
          <input v-model="dbPath" placeholder="Select .db file..." readonly class="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 cursor-not-allowed" />
          <button @click="selectOpenPath" class="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Browse</button>
        </div>
        <div class="flex justify-end space-x-2">
          <button @click="showOpenDb = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          <button @click="doOpenDb" class="px-4 py-2 rounded bg-[var(--color-primary)] text-white" :disabled="!dbPath">Open</button>
        </div>
      </div>
    </div>

    <!-- Category Modal -->`
);

// Update Context Menu Items
appVue = appVue.replace(
  /<!-- Context Menu -->[\s\S]*?<!-- Modals -->/,
  `<!-- Context Menu -->
    <div v-if="contextMenu.show" :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }" class="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg py-1 z-[100] w-48 text-sm rounded shadow-xl">
      <div v-if="contextMenu.type === 'pane'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="handleContextMenu('createDb')">Create Database</div>
      <div v-if="contextMenu.type === 'pane'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="handleContextMenu('openDb')">Open Database</div>
      
      <div v-if="contextMenu.type === 'db'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500" @click="handleContextMenu('closeDb')">Close Database</div>
      <div v-if="contextMenu.type === 'db'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-t border-gray-200 dark:border-gray-600 mt-1 pt-1" @click="handleContextMenu('addCategory')">Add Category</div>

      <div v-if="contextMenu.type === 'category'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="handleContextMenu('addBook')">Add Book to Category</div>
      <div v-if="contextMenu.type === 'category'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 mb-1 pb-1" @click="handleContextMenu('addCategory')">Add Sub-category</div>
      <div v-if="contextMenu.type === 'category'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500" @click="handleContextMenu('deleteCategory')">Delete Category</div>
    </div>

    <!-- Modals -->`
);

// Replace confirm import and dbName variables in script
appVue = appVue.replace(
  /import \{ save, open \} from '@tauri-apps\/plugin-dialog';/,
  `import { save, open, confirm } from '@tauri-apps/plugin-dialog';`
);

appVue = appVue.replace(
  /const dbName = ref\(''\);/,
  `const dbDescription = ref('');`
);

appVue = appVue.replace(
  /const selectDb = \(db: string\) => {/,
  `const selectDb = (db: any) => {`
);

appVue = appVue.replace(
  /store\.currentDb = db;/,
  `store.currentDb = db.id;`
);

appVue = appVue.replace(
  /const onDbContextMenu = \(event: MouseEvent, db: string\) => {/,
  `const onDbContextMenu = (event: MouseEvent, db: any) => {`
);

appVue = appVue.replace(
  /store\.currentDb = db;/,
  `store.currentDb = db.id;`
);

appVue = appVue.replace(
  /nodeName: db/,
  `nodeName: db.description,\n    nodeId: db.id`
);

appVue = appVue.replace(
  /const handleContextMenu = \(action: string\) => {[\s\S]*?closeContextMenu\(\);\n};/,
  `const handleDeleteCategory = async (categoryId: number) => {
  if (!store.currentDb) return;
  try {
    const count = await invoke('count_books_in_category', { dbName: store.currentDb, categoryId }) as number;
    if (count > 0) {
      const yes = await confirm(\`This category and its sub-categories contain \${count} books. Are you sure you want to delete them all?\`, { title: 'Confirm Deletion', kind: 'warning' });
      if (!yes) return;
    }
    await invoke('delete_category', { dbName: store.currentDb, categoryId });
    store.fetchCategories();
    store.fetchBooks(null);
  } catch(e) { console.error(e) }
};

const handleContextMenu = async (action: string) => {
  if (action === 'addCategory') {
    categoryName.value = '';
    showAddCategory.value = true;
  } else if (action === 'addBook') {
    openAddBookModal();
  } else if (action === 'createDb') {
    dbDescription.value = '';
    dbPath.value = '';
    showCreateDb.value = true;
  } else if (action === 'openDb') {
    dbPath.value = '';
    showOpenDb.value = true;
  } else if (action === 'closeDb') {
    await store.closeDatabase(contextMenu.value.nodeId as string);
  } else if (action === 'deleteCategory') {
    await handleDeleteCategory(contextMenu.value.nodeId as number);
  }
  closeContextMenu();
};`
);

appVue = appVue.replace(
  /const doCreateDb = async \(\) => {[\s\S]*?dbPath\.value = '';\n};/,
  `const doCreateDb = async () => {
  if (!dbDescription.value || !dbPath.value) return;
  await store.createDatabase(dbDescription.value, dbPath.value);
  showCreateDb.value = false;
  dbDescription.value = '';
  dbPath.value = '';
};`
);

appVue = appVue.replace(
  /const doOpenDb = async \(\) => {[\s\S]*?dbPath\.value = '';\n};/,
  `const doOpenDb = async () => {
  if (!dbPath.value) return;
  await store.openDatabase(dbPath.value);
  showOpenDb.value = false;
  dbPath.value = '';
};`
);

appVue = appVue.replace(
  /@click="dbName=''; dbPath=''; showCreateDb=true"/,
  `@click="dbDescription=''; dbPath=''; showCreateDb=true"`
);
appVue = appVue.replace(
  /@click="dbName=''; dbPath=''; showOpenDb=true"/,
  `@click="dbPath=''; showOpenDb=true"`
);

// Fix buildTree to default isOpen to true
appVue = appVue.replace(
  /categories\.forEach\(c => map\.set\(c\.id, \{ \.\.\.c, children: \[\] \}\)\);/,
  `categories.forEach(c => map.set(c.id, { ...c, children: [], isOpen: true }));`
);


fs.writeFileSync('/workspace/e-lib-pro/src/App.vue', appVue);
