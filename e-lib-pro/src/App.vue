<template>
  <div class="h-screen w-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200">
    <!-- Menu Bar -->
    <header class="h-8 bg-gray-200 dark:bg-gray-800 flex items-center px-4 space-x-4 text-sm select-none border-b border-gray-300 dark:border-gray-700">
      <div class="relative group">
        <div class="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 px-2 py-1 rounded">File</div>
        <div class="absolute hidden group-hover:block top-full left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg py-1 z-50 w-48">
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="showCreateDb = true">Create New Database</div>
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="showOpenDb = true">Open Existing Database</div>
        </div>
      </div>
      <div class="relative group">
        <div class="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 px-2 py-1 rounded">Edit</div>
        <div class="absolute hidden group-hover:block top-full left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg py-1 z-50 w-48">
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="showAddBook = true">Add New Book</div>
        </div>
      </div>
      <div class="relative group">
        <div class="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 px-2 py-1 rounded">View</div>
        <div class="absolute hidden group-hover:block top-full left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg py-1 z-50 w-48">
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="showConfig = true">GUI Config Editor</div>
        </div>
      </div>
    </header>

    <!-- Main Content Grid -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Pane: TreeView -->
      <aside class="w-64 border-r border-gray-300 dark:border-gray-700 p-2 overflow-y-auto bg-gray-100 dark:bg-gray-800">
        <div v-for="db in store.databases" :key="db" class="mb-4">
          <div class="font-bold cursor-pointer hover:text-blue-500" @click="selectDb(db)">🗄️ {{ db }}</div>
          <TreeView v-if="store.currentDb === db" :nodes="buildTree(store.categories)" @select="onCategorySelect" />
        </div>
      </aside>

      <!-- Right Pane: Split Vertically -->
      <main class="flex-1 flex flex-col min-w-0">
        <!-- Top Right Pane: Resizable Table -->
        <div class="flex-1 border-b border-gray-300 dark:border-gray-700 overflow-auto bg-white dark:bg-gray-900">
          <BookTable :books="store.books" @select="store.selectBook" />
        </div>

        <!-- Bottom Right Pane: Book Detail -->
        <div class="h-64 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-800 flex shrink-0">
          <BookDetail :book="store.selectedBook" :cover="store.bookCover" />
        </div>
      </main>
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
        </div>
        <div class="flex justify-end space-x-2 mt-6">
          <button @click="showConfig = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Close</button>
          <button @click="saveConfig" class="px-4 py-2 rounded bg-blue-500 text-white">Save</button>
        </div>
      </div>
    </div>

    <!-- Modals -->
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
          <button @click="doAddBook" class="px-4 py-2 rounded bg-blue-500 text-white">Add</button>
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

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLibraryStore } from './store';
import TreeView from './components/TreeView.vue';
import BookTable from './components/BookTable.vue';
import BookDetail from './components/BookDetail.vue';

const store = useLibraryStore();

const showCreateDb = ref(false);
const showOpenDb = ref(false);
const showAddBook = ref(false);

import { invoke } from '@tauri-apps/api/core';

const bookForm = ref({
  title: '',
  author: '',
  publisher: '',
  isbn: '',
  edition: '',
  local_path: '',
  notes: '',
  bibtex: '',
  coverBytes: [] as number[],
  coverName: '',
});

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
  
  if (bookForm.value.bibtex.trim() !== '') {
    await invoke('import_bibtex', { 
      dbName: store.currentDb, 
      categoryId: null, 
      bibtexContent: bookForm.value.bibtex 
    });
  } else {
    await invoke('add_book', {
      dbName: store.currentDb,
      categoryId: null,
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
  store.fetchBooks(null);
  
  // reset form
  bookForm.value = {
    title: '', author: '', publisher: '', isbn: '', edition: '', local_path: '', notes: '', bibtex: '', coverBytes: [], coverName: ''
  };
};

const dbName = ref('');
const dbPath = ref('');




const showConfig = ref(false);
const config = ref({ darkMode: false, primaryColor: '#3b82f6' });

onMounted(async () => {
  store.loadDatabases();
  try {
    const confStr = await invoke('read_config');
    const conf = JSON.parse(confStr as string);
    if (conf.darkMode !== undefined) config.value.darkMode = conf.darkMode;
    if (conf.primaryColor !== undefined) config.value.primaryColor = conf.primaryColor;
    applyConfig();
  } catch (e) {}
});

const applyConfig = () => {
  if (config.value.darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  document.documentElement.style.setProperty('--color-primary', config.value.primaryColor);
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

const doCreateDb = async () => {
  await store.createDatabase(dbName.value, dbPath.value);
  showCreateDb.value = false;
};

const doOpenDb = async () => {
  await store.openDatabase(dbName.value, dbPath.value);
  showOpenDb.value = false;
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