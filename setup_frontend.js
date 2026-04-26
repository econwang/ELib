const fs = require('fs');
const path = require('path');

const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.trim());
};

write('/workspace/e-lib-pro/src/App.vue', `
<template>
  <div class="h-screen w-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200">
    <!-- Menu Bar -->
    <header class="h-8 bg-gray-200 dark:bg-gray-800 flex items-center px-4 space-x-4 text-sm select-none border-b border-gray-300 dark:border-gray-700">
      <div class="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 px-2 py-1 rounded">File</div>
      <div class="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 px-2 py-1 rounded">Edit</div>
      <div class="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 px-2 py-1 rounded">View</div>
    </header>

    <!-- Main Content Grid -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Pane: TreeView -->
      <aside class="w-64 border-r border-gray-300 dark:border-gray-700 p-2 overflow-y-auto">
        <TreeView :nodes="databases" />
      </aside>

      <!-- Right Pane: Split Vertically -->
      <main class="flex-1 flex flex-col">
        <!-- Top Right Pane: Resizable Table -->
        <div class="flex-1 border-b border-gray-300 dark:border-gray-700 overflow-auto">
          <BookTable :books="books" />
        </div>

        <!-- Bottom Right Pane: Book Detail -->
        <div class="h-64 p-4 overflow-y-auto flex">
          <BookDetail :book="selectedBook" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TreeView from './components/TreeView.vue';
import BookTable from './components/BookTable.vue';
import BookDetail from './components/BookDetail.vue';

const databases = ref([{ id: 1, name: 'Library A', children: [{ id: 2, name: 'Science' }] }]);
const books = ref([{ id: 1, title: 'Rust Programming', author: 'Steve', publisher: 'No Starch' }]);
const selectedBook = ref(books.value[0]);
</script>
`);

write('/workspace/e-lib-pro/src/components/TreeView.vue', `
<template>
  <ul class="pl-4">
    <li v-for="node in nodes" :key="node.id" class="my-1">
      <div class="flex items-center space-x-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 p-1 rounded" @contextmenu.prevent="onContextMenu(node)">
        <span v-if="node.children" class="text-xs">▶</span>
        <span>{{ node.name }}</span>
      </div>
      <TreeView v-if="node.children" :nodes="node.children" />
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{ nodes: any[] }>();
const onContextMenu = (node: any) => {
  // Context menu logic
};
</script>
`);

write('/workspace/e-lib-pro/src/components/BookTable.vue', `
<template>
  <table class="w-full text-left border-collapse">
    <thead class="bg-gray-100 dark:bg-gray-800 sticky top-0">
      <tr>
        <th class="p-2 border-b dark:border-gray-700">Title</th>
        <th class="p-2 border-b dark:border-gray-700">Author</th>
        <th class="p-2 border-b dark:border-gray-700">Publisher</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="book in books" :key="book.id" class="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
        <td class="p-2 border-b dark:border-gray-700">{{ book.title }}</td>
        <td class="p-2 border-b dark:border-gray-700">{{ book.author }}</td>
        <td class="p-2 border-b dark:border-gray-700">{{ book.publisher }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
defineProps<{ books: any[] }>();
</script>
`);

write('/workspace/e-lib-pro/src/components/BookDetail.vue', `
<template>
  <div v-if="book" class="flex w-full space-x-6">
    <!-- Left: Cover Image -->
    <div class="w-32 h-48 bg-gray-200 dark:bg-gray-800 flex items-center justify-center rounded shadow">
      <span class="text-sm text-gray-500">No Cover</span>
    </div>
    
    <!-- Right: Metadata -->
    <div class="flex-1 space-y-2">
      <h2 class="text-xl font-bold">{{ book.title }}</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400">Author: {{ book.author }}</p>
      <p class="text-sm text-gray-600 dark:text-gray-400">Publisher: {{ book.publisher }}</p>
      <div class="mt-4">
        <h3 class="font-semibold text-sm">Notes</h3>
        <textarea class="w-full h-24 p-2 mt-1 border rounded dark:bg-gray-800 dark:border-gray-700"></textarea>
      </div>
    </div>
  </div>
  <div v-else class="flex items-center justify-center w-full h-full text-gray-500">
    Select a book to view details
  </div>
</template>

<script setup lang="ts">
defineProps<{ book: any }>();
</script>
`);

console.log('Frontend files written successfully');
