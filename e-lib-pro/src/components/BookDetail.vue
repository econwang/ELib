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