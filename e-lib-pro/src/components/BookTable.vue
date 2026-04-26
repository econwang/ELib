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