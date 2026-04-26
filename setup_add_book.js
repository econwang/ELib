const fs = require('fs');

const content = fs.readFileSync('/workspace/e-lib-pro/src/App.vue', 'utf-8');

const newModals = `
    <!-- Modals -->
    <div v-if="showCreateDb" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
        <h2 class="text-xl mb-4">Create Database</h2>
        <input v-model="dbName" placeholder="Database Name" class="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
        <input v-model="dbPath" placeholder="Path (e.g., C:/data.db)" class="w-full mb-4 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
        <div class="flex justify-end space-x-2">
          <button @click="showCreateDb = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          <button @click="doCreateDb" class="px-4 py-2 rounded bg-blue-500 text-white">Create</button>
        </div>
      </div>
    </div>

    <div v-if="showOpenDb" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
        <h2 class="text-xl mb-4">Open Database</h2>
        <input v-model="dbName" placeholder="Database Name" class="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
        <input v-model="dbPath" placeholder="Path (e.g., C:/data.db)" class="w-full mb-4 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
        <div class="flex justify-end space-x-2">
          <button @click="showOpenDb = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          <button @click="doOpenDb" class="px-4 py-2 rounded bg-blue-500 text-white">Open</button>
        </div>
      </div>
    </div>

    <div v-if="showAddBook" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-[500px] max-h-screen overflow-y-auto">
        <h2 class="text-xl mb-4">Add New Book</h2>
        <div class="space-y-3">
          <input v-model="bookForm.title" placeholder="Title" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <input v-model="bookForm.author" placeholder="Author" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <input v-model="bookForm.publisher" placeholder="Publisher" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <input v-model="bookForm.isbn" placeholder="ISBN" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <input v-model="bookForm.edition" placeholder="Edition" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <input v-model="bookForm.local_path" placeholder="Local Path" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <textarea v-model="bookForm.notes" placeholder="Notes" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 h-20"></textarea>
          
          <div class="border border-dashed border-gray-400 p-4 text-center rounded">
            <label class="cursor-pointer block">
              <span class="text-blue-500">Upload Cover Image</span>
              <input type="file" accept="image/*" @change="onCoverChange" class="hidden" />
            </label>
            <div v-if="bookForm.coverName" class="text-xs text-gray-500 mt-2">{{ bookForm.coverName }}</div>
          </div>
          
          <div class="border border-dashed border-gray-400 p-4 text-center rounded">
            <textarea v-model="bookForm.bibtex" placeholder="Or paste BibTeX here to import" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm h-24"></textarea>
          </div>
        </div>
        
        <div class="flex justify-end space-x-2 mt-4">
          <button @click="showAddBook = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          <button @click="doAddBook" class="px-4 py-2 rounded bg-blue-500 text-white">Add</button>
        </div>
      </div>
    </div>
`;

const newScript = `
import { invoke } from '@tauri-apps/api/core';

const bookForm = ref({
  title: '',
  author: '',
  publisher: '',
  isbn: '',
  edition: '',
  local_path: '',
  notes: '',
  bibtex: '',
  coverBytes: [] as number[],
  coverName: '',
});

const onCoverChange = (e: any) => {
  const file = e.target.files[0];
  if (file) {
    bookForm.value.coverName = file.name;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target && ev.target.result) {
        const buffer = new Uint8Array(ev.target.result as ArrayBuffer);
        bookForm.value.coverBytes = Array.from(buffer);
      }
    };
    reader.readAsArrayBuffer(file);
  }
};

const doAddBook = async () => {
  if (!store.currentDb) return;
  
  if (bookForm.value.bibtex.trim() !== '') {
    await invoke('import_bibtex', { 
      dbName: store.currentDb, 
      categoryId: null, 
      bibtexContent: bookForm.value.bibtex 
    });
  } else {
    await invoke('add_book', {
      dbName: store.currentDb,
      categoryId: null,
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
  
  showAddBook.value = false;
  store.fetchBooks(null);
  
  // reset form
  bookForm.value = {
    title: '', author: '', publisher: '', isbn: '', edition: '', local_path: '', notes: '', bibtex: '', coverBytes: [], coverName: ''
  };
};
`;

let replaced = content.replace(/<!-- Modals -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, newModals);
replaced = replaced.replace(/const showAddBook = ref\(false\);/, 'const showAddBook = ref(false);\n' + newScript);

fs.writeFileSync('/workspace/e-lib-pro/src/App.vue', replaced);

