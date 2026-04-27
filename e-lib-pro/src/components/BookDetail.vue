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
        <div class="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
          <span class="font-semibold text-gray-900 dark:text-gray-100">Author:</span>
          <div class="flex flex-wrap gap-1">
            <span v-for="(author, i) in String(book.author || '').split(';').filter(a => a.trim() !== '')" :key="i" class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
              {{ author.trim() }}
            </span>
          </div>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-300"><span class="font-semibold text-gray-900 dark:text-gray-100">Publisher:</span> {{ book.publisher || 'Unknown' }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300"><span class="font-semibold text-gray-900 dark:text-gray-100">ISBN:</span> {{ book.isbn || 'N/A' }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300"><span class="font-semibold text-gray-900 dark:text-gray-100">Edition:</span> {{ book.edition || 'N/A' }}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300 col-span-2 truncate" :title="book.local_path">
          <span class="font-semibold text-gray-900 dark:text-gray-100">Local Path:</span> 
          <a v-if="book.local_path" href="#" @click.prevent="openLocalPath" class="text-blue-500 hover:underline cursor-pointer">{{ book.local_path }}</a>
          <span v-else>Not set</span>
        </p>
      </div>
      <div class="mt-4 flex flex-col">
        <h3 class="font-semibold text-sm mb-2 text-gray-900 dark:text-gray-100">Personal Notes</h3>
        <div 
          class="p-4 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 prose dark:prose-invert max-w-none break-words custom-prose"
          v-html="renderedNotes"
        ></div>
      </div>
    </div>
  </div>
  <div v-else class="flex items-center justify-center w-full h-full text-gray-400 dark:text-gray-500 text-lg">
    Select a book from the list to view its details
  </div>
</template>

<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core';
import { computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const props = defineProps<{ book: any, cover: string | null }>();

const renderedNotes = computed(() => {
  if (!props.book?.notes) return '<p class="text-gray-400 italic">No notes available.</p>';
  // Parse markdown
  const rawHtml = marked.parse(props.book.notes) as string;
  // Sanitize to prevent XSS
  return DOMPurify.sanitize(rawHtml);
});

const openLocalPath = async () => {
  if (props.book?.local_path) {
    try {
      await invoke('open_local_file', { path: props.book.local_path });
    } catch (error) {
      console.error('Failed to open file:', error);
      alert('Failed to open file: ' + error);
    }
  }
};
</script>