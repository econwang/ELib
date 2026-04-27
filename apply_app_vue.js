const fs = require('fs');
let appVue = fs.readFileSync('/workspace/e-lib-pro/src/App.vue', 'utf-8');

// 1. Update BookTable binding
appVue = appVue.replace(
  /<BookTable :books="store\.books" @select="store\.selectBook" \/>/,
  `<BookTable :books="store.books" @select="store.selectBook" @edit="openEditBookModal" @contextmenu="onBookContextMenu" />`
);

// 2. Add Book Context Menu Template
appVue = appVue.replace(
  /<!-- Context Menu -->/,
  `<!-- Context Menu -->`
);

appVue = appVue.replace(
  /<div v-if="contextMenu\.type === 'category'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500" @click="handleContextMenu\('deleteCategory'\)">Delete Category<\/div>/,
  `<div v-if="contextMenu.type === 'category'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500" @click="handleContextMenu('deleteCategory')">Delete Category</div>
      
      <div v-if="contextMenu.type === 'book'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="handleContextMenu('editBook')">Edit Book</div>
      <div v-if="contextMenu.type === 'book'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500" @click="handleContextMenu('deleteBook')">Delete Book</div>`
);

// 3. Update bookForm and openAddBookModal
appVue = appVue.replace(
  /const bookForm = ref\(\{[\s\S]*?\}\);/,
  `const bookForm = ref({
  id: null as number | null,
  title: '', author: '', publisher: '', isbn: '', edition: '', local_path: '', notes: '', bibtex: '', coverBytes: [] as number[], coverName: ''
});`
);

appVue = appVue.replace(
  /const openAddBookModal = \(\) => \{[\s\S]*?showAddBook\.value = true;\n\};/,
  `const openAddBookModal = () => {
  if (store.currentCategoryId === null) {
    alert('Please select a specific category first to add a book.');
    return;
  }
  bookForm.value = { id: null, title: '', author: '', publisher: '', isbn: '', edition: '', local_path: '', notes: '', bibtex: '', coverBytes: [], coverName: '' };
  showAddBook.value = true;
};

const openEditBookModal = (book: any) => {
  bookForm.value = {
    id: book.id,
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    isbn: book.isbn,
    edition: book.edition,
    local_path: book.local_path,
    notes: book.notes,
    bibtex: '',
    coverBytes: [],
    coverName: ''
  };
  showAddBook.value = true;
};

const onBookContextMenu = ({ event, book }: any) => {
  event.preventDefault();
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    type: 'book',
    nodeId: book.id,
    nodeName: book.title
  };
};`
);

// 4. Update doAddBook logic
appVue = appVue.replace(
  /const doAddBook = async \(\) => \{[\s\S]*?store\.fetchBooks\(targetCategory\);\n\};/,
  `const doAddBook = async () => {
  if (!store.currentDb) return;
  const targetCategory = bookForm.value.id ? null : store.currentCategoryId; // Keep existing category if editing
  
  try {
    if (bookForm.value.id) {
      await invoke('update_book', {
        dbName: store.currentDb,
        id: bookForm.value.id,
        title: bookForm.value.title,
        author: bookForm.value.author,
        publisher: bookForm.value.publisher,
        isbn: bookForm.value.isbn,
        edition: bookForm.value.edition,
        localPath: bookForm.value.local_path,
        notes: bookForm.value.notes
      });
    } else {
      if (bookForm.value.bibtex.trim() !== '') {
        await invoke('import_bibtex', { 
          dbName: store.currentDb, 
          categoryId: targetCategory, 
          bibtexContent: bookForm.value.bibtex 
        });
      } else {
        await invoke('add_book', {
          dbName: store.currentDb,
          categoryId: targetCategory,
          title: bookForm.value.title,
          author: bookForm.value.author,
          publisher: bookForm.value.publisher,
          isbn: bookForm.value.isbn,
          edition: bookForm.value.edition,
          localPath: bookForm.value.local_path,
          coverBytes: bookForm.value.coverBytes,
          notes: bookForm.value.notes
        });
      }
    }
    
    showAddBook.value = false;
    store.fetchBooks(store.currentCategoryId);
  } catch (e) {
    console.error(e);
  }
};`
);

// 5. Add delete book to handleContextMenu
appVue = appVue.replace(
  /\} else if \(action === 'deleteCategory'\) \{/,
  `} else if (action === 'editBook') {
    const book = store.books.find(b => b.id === contextMenu.value.nodeId);
    if (book) openEditBookModal(book);
  } else if (action === 'deleteBook') {
    const yes = await confirm(\`Are you sure you want to delete "\${contextMenu.value.nodeName}"?\`, { title: 'Confirm Deletion' });
    if (yes) {
      await invoke('delete_book', { dbName: store.currentDb, id: contextMenu.value.nodeId as number });
      store.fetchBooks(store.currentCategoryId);
    }
  } else if (action === 'deleteCategory') {`
);

// 6. Update context menu addBook to also use openAddBookModal
appVue = appVue.replace(
  /\} else if \(action === 'addBook'\) \{[\s\S]*?openAddBookModal\(\);/,
  `} else if (action === 'addBook') {
    store.currentCategoryId = contextMenu.value.nodeId as number;
    openAddBookModal();`
);

// 7. Update Add New Book Modal title depending on mode
appVue = appVue.replace(
  /<h2 class="text-xl mb-4">Add New Book<\/h2>/,
  `<h2 class="text-xl mb-4">{{ bookForm.id ? 'Edit Book' : 'Add New Book' }}</h2>`
);
appVue = appVue.replace(
  /<button @click="doAddBook" class="px-4 py-2 rounded bg-\[var\(--color-primary\)\] text-white">Add<\/button>/,
  `<button @click="doAddBook" class="px-4 py-2 rounded bg-[var(--color-primary)] text-white">{{ bookForm.id ? 'Save' : 'Add' }}</button>`
);

fs.writeFileSync('/workspace/e-lib-pro/src/App.vue', appVue);
