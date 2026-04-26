const fs = require('fs');

const storeTs = `
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'

export const useLibraryStore = defineStore('library', () => {
  const databases = ref<string[]>([])
  const currentDb = ref<string | null>(null)
  const categories = ref<any[]>([])
  const books = ref<any[]>([])
  const selectedBook = ref<any>(null)
  const bookCover = ref<string | null>(null)
  
  const loadDatabases = () => {
    const saved = localStorage.getItem('elib_dbs')
    if (saved) {
      databases.value = JSON.parse(saved)
    }
  }

  const saveDatabases = () => {
    localStorage.setItem('elib_dbs', JSON.stringify(databases.value))
  }

  const openDatabase = async (name: string, path: string) => {
    try {
      await invoke('open_db', { dbName: name, path })
      if (!databases.value.includes(name)) {
        databases.value.push(name)
        saveDatabases()
      }
      currentDb.value = name
      await fetchCategories()
      await fetchBooks(null)
    } catch (e) {
      console.error(e)
    }
  }

  const createDatabase = async (name: string, path: string) => {
    try {
      await invoke('create_db', { dbName: name, path })
      if (!databases.value.includes(name)) {
        databases.value.push(name)
        saveDatabases()
      }
      currentDb.value = name
      await fetchCategories()
      await fetchBooks(null)
    } catch (e) {
      console.error(e)
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
    loadDatabases, openDatabase, createDatabase, fetchCategories, fetchBooks, selectBook
  }
})
`;

const appVue = `
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
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="toggleTheme">Toggle Theme</div>
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
const dbName = ref('');
const dbPath = ref('');

onMounted(() => {
  store.loadDatabases();
});

const toggleTheme = () => {
  document.documentElement.classList.toggle('dark');
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
`;

const mainTs = `
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
`;

const treeViewVue = `
<template>
  <ul class="pl-4">
    <li v-for="node in nodes" :key="node.id" class="my-1">
      <div class="flex items-center space-x-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded" @click="$emit('select', node)">
        <span v-if="node.children && node.children.length" class="text-xs text-gray-500">▶</span>
        <span v-else class="text-xs text-transparent">▶</span>
        <span>📁 {{ node.name }}</span>
      </div>
      <TreeView v-if="node.children && node.children.length" :nodes="node.children" @select="$emit('select', $event)" />
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{ nodes: any[] }>();
defineEmits(['select']);
</script>
`;

const bookTableVue = `
<template>
  <table class="w-full text-left border-collapse whitespace-nowrap">
    <thead class="bg-gray-100 dark:bg-gray-800 sticky top-0 shadow-sm z-10">
      <tr>
        <th class="p-2 border-b border-gray-300 dark:border-gray-700 font-semibold text-sm">Title</th>
        <th class="p-2 border-b border-gray-300 dark:border-gray-700 font-semibold text-sm">Author</th>
        <th class="p-2 border-b border-gray-300 dark:border-gray-700 font-semibold text-sm">Publisher</th>
        <th class="p-2 border-b border-gray-300 dark:border-gray-700 font-semibold text-sm">ISBN</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="book in books" :key="book.id" @click="$emit('select', book)" class="hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors">
        <td class="p-2 truncate max-w-xs">{{ book.title }}</td>
        <td class="p-2 truncate max-w-xs">{{ book.author }}</td>
        <td class="p-2 truncate max-w-xs">{{ book.publisher }}</td>
        <td class="p-2 truncate max-w-xs">{{ book.isbn }}</td>
      </tr>
      <tr v-if="!books || books.length === 0">
        <td colspan="4" class="p-8 text-center text-gray-500">No books found in this category.</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
defineProps<{ books: any[] }>();
defineEmits(['select']);
</script>
`;

const bookDetailVue = `
<template>
  <div v-if="book" class="flex w-full space-x-6">
    <!-- Left: Cover Image -->
    <div class="w-32 h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded shadow-md overflow-hidden shrink-0">
      <img v-if="cover" :src="cover" class="w-full h-full object-cover" />
      <span v-else class="text-sm text-gray-500 dark:text-gray-400">No Cover</span>
    </div>

    <!-- Right: Metadata -->
    <div class="flex-1 space-y-3 min-w-0">
      <h2 class="text-2xl font-bold truncate" :title="book.title">{{ book.title }}</h2>
      <div class="grid grid-cols-2 gap-4">
        <p class="text-sm text-gray-600 dark:text-gray-300"><span class="font-semibold text-gray-900 dark:text-gray-100">Author:</span> {{ book.author || 'Unknown' }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300"><span class="font-semibold text-gray-900 dark:text-gray-100">Publisher:</span> {{ book.publisher || 'Unknown' }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300"><span class="font-semibold text-gray-900 dark:text-gray-100">ISBN:</span> {{ book.isbn || 'N/A' }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300"><span class="font-semibold text-gray-900 dark:text-gray-100">Edition:</span> {{ book.edition || 'N/A' }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300 col-span-2 truncate" :title="book.local_path"><span class="font-semibold text-gray-900 dark:text-gray-100">Local Path:</span> <a href="#" class="text-blue-500 hover:underline">{{ book.local_path || 'Not set' }}</a></p>
      </div>
      <div class="mt-4 flex flex-col h-full">
        <h3 class="font-semibold text-sm mb-1">Personal Notes</h3>
        <textarea readonly class="w-full flex-1 p-2 border rounded bg-white dark:bg-gray-900 dark:border-gray-700 resize-none text-sm">{{ book.notes }}</textarea>
      </div>
    </div>
  </div>
  <div v-else class="flex items-center justify-center w-full h-full text-gray-400 dark:text-gray-500 text-lg">
    Select a book from the list to view its details
  </div>
</template>

<script setup lang="ts">
defineProps<{ book: any, cover: string | null }>();
</script>
`;

fs.writeFileSync('/workspace/e-lib-pro/src/store.ts', storeTs.trim());
fs.writeFileSync('/workspace/e-lib-pro/src/App.vue', appVue.trim());
fs.writeFileSync('/workspace/e-lib-pro/src/main.ts', mainTs.trim());
fs.writeFileSync('/workspace/e-lib-pro/src/components/TreeView.vue', treeViewVue.trim());
fs.writeFileSync('/workspace/e-lib-pro/src/components/BookTable.vue', bookTableVue.trim());
fs.writeFileSync('/workspace/e-lib-pro/src/components/BookDetail.vue', bookDetailVue.trim());

