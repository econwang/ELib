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
  
  const loadDatabases = async () => {
    const saved = localStorage.getItem('elib_dbs')
    if (saved) {
      databases.value = JSON.parse(saved)
      if (databases.value.length > 0) {
        // Automatically open the first database
        await openDatabase(databases.value[0], databases.value[0] + '.db')
      }
    } else {
      // If no database exists, auto-create a default one for the user
      await createDatabase('Default Library', 'default.db')
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