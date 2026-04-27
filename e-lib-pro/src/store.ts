import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'

export interface DatabaseInfo {
  id: string;
  path: string;
  description: string;
}

export const useLibraryStore = defineStore('library', () => {
  const databases = ref<DatabaseInfo[]>([])
  const currentDb = ref<string | null>(null)
  const categories = ref<any[]>([])
  const books = ref<any[]>([])
  const selectedBook = ref<any>(null)
  const bookCover = ref<string | null>(null)
  
  const loadDatabases = async () => {
    const saved = localStorage.getItem('elib_dbs')
    if (saved) {
      const parsed = JSON.parse(saved);
      databases.value = parsed.map((d: any) => typeof d === 'string' ? { id: d, path: d + '.db', description: d } : d);
      if (databases.value.length > 0) {
        await openDatabase(databases.value[0].path)
      }
    } else {
      // First launch: Clear any legacy state just in case, then create a clean default library
      localStorage.removeItem('elib_dbs');
      databases.value = [];
      await createDatabase('Default Library', 'default.db');
      
      // Add a sample category and a sample book
      if (currentDb.value) {
        try {
          const categoryId = await invoke('add_category', { dbName: currentDb.value, parentId: null, name: 'Getting Started', level: 1 }) as number;
          await invoke('add_book', {
            dbName: currentDb.value,
            categoryId: categoryId,
            title: 'Welcome to eLibPro',
            author: 'Trae Agent',
            publisher: 'eLib Foundation',
            isbn: '978-3-16-148410-0',
            edition: '1st',
            localPath: '',
            coverBytes: [],
            notes: 'This is a sample book to help you get started with eLibPro. You can right-click on categories to add more books, or right-click on the database to add new categories!'
          });
          await fetchCategories();
          await fetchBooks(null);
        } catch (e) {
          console.error('Failed to add sample data:', e);
        }
      }
    }
  }

  const saveDatabases = () => {
    localStorage.setItem('elib_dbs', JSON.stringify(databases.value))
  }

  const openDatabase = async (path: string) => {
    try {
      await invoke('open_db', { dbName: path, path })
      const desc = await invoke('get_db_description', { dbName: path }) as string;
      if (!databases.value.find(d => d.id === path)) {
        databases.value.push({ id: path, path, description: desc })
        saveDatabases()
      }
      currentDb.value = path
      await fetchCategories()
      await fetchBooks(null)
    } catch (e) {
      console.error(e)
    }
  }

  const createDatabase = async (description: string, path: string) => {
    try {
      await invoke('create_db', { dbName: path, path, description })
      if (!databases.value.find(d => d.id === path)) {
        databases.value.push({ id: path, path, description })
        saveDatabases()
      }
      currentDb.value = path
      await fetchCategories()
      await fetchBooks(null)
    } catch (e) {
      console.error(e)
    }
  }

  const closeDatabase = async (id: string) => {
    try {
      await invoke('close_db', { dbName: id });
      databases.value = databases.value.filter(d => d.id !== id);
      saveDatabases();
      if (currentDb.value === id) {
        currentDb.value = null;
        categories.value = [];
        books.value = [];
        selectedBook.value = null;
        bookCover.value = null;
        if (databases.value.length > 0) {
          await openDatabase(databases.value[0].path);
        }
      }
    } catch (e) {
      console.error(e);
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

  const getCategoryLevel = (parentId: number | null): number => {
    if (!parentId) return 1;
    const parent = categories.value.find(c => c.id === parentId);
    if (!parent) return 1;
    return (parent.level || 1) + 1;
  }

  const addCategory = async (parentId: number | null, name: string) => {
    if (!currentDb.value) return
    const level = getCategoryLevel(parentId);
    if (level > 5) {
      alert('Maximum category depth (5 levels) reached.');
      return;
    }
    try {
      await invoke('add_category', { dbName: currentDb.value, parentId, name, level })
      await fetchCategories()
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
    loadDatabases, openDatabase, createDatabase, closeDatabase, fetchCategories, fetchBooks, selectBook, addCategory
  }
})