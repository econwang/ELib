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

  const addCategory = async (parentId: number | null, name: string) => {
    if (!currentDb.value) return
    try {
      await invoke('add_category', { dbName: currentDb.value, parentId, name, level: 0 })
      await fetchCategories()
    } catch (e) {
      console.error(e)
    }
  }

  return {
    databases, currentDb, categories, books, selectedBook, bookCover,
    loadDatabases, openDatabase, createDatabase, fetchCategories, fetchBooks, selectBook, addCategory
  }
})
`;

fs.writeFileSync('/workspace/e-lib-pro/src/store.ts', storeTs.trim());

const treeViewVue = `
<template>
  <ul class="pl-4">
    <li v-for="node in nodes" :key="node.id" class="my-1">
      <div class="flex items-center space-x-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded" 
           @click="$emit('select', node)"
           @contextmenu.prevent="$emit('contextmenu', { event: $event, node })">
        <span v-if="node.children && node.children.length" class="text-xs text-gray-500">▶</span>
        <span v-else class="text-xs text-transparent">▶</span>
        <span>📁 {{ node.name }}</span>
      </div>
      <TreeView v-if="node.children && node.children.length" :nodes="node.children" @select="$emit('select', $event)" @contextmenu="$emit('contextmenu', $event)" />
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{ nodes: any[] }>();
defineEmits(['select', 'contextmenu']);
</script>
`;

fs.writeFileSync('/workspace/e-lib-pro/src/components/TreeView.vue', treeViewVue.trim());
