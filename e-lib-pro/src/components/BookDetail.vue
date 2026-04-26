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