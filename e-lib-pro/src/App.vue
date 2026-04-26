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