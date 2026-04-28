<template>
  <div class="h-screen w-screen flex flex-col bg-app-bg text-app-text transition-colors duration-200" :style="customStyle">
    <!-- Menu Bar -->
    <header class="h-8 bg-app-panel flex items-center px-4 space-x-4 font-menu select-none border-b border-app-border shrink-0">
      <div class="relative group">
        <div class="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 px-2 py-1 rounded">File</div>
        <div class="absolute hidden group-hover:block top-full left-0 bg-app-surface border border-app-border shadow-lg py-1 z-50 w-48">
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="dbDescription=''; dbPath=''; showCreateDb=true">Create Database</div>
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="dbPath=''; showOpenDb=true">Open Database</div>
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="exportBibtex">Export Bibtex</div>
        </div>
      </div>
      <div class="relative group">
        <div class="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 px-2 py-1 rounded">Edit</div>
        <div class="absolute hidden group-hover:block top-full left-0 bg-app-surface border border-app-border shadow-lg py-1 z-50 w-48">
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="openAddBookModal">Add New Book</div>
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="showAddCategory = true">Add Category</div>
        </div>
      </div>
      <div class="relative group">
        <div class="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 px-2 py-1 rounded">View</div>
        <div class="absolute hidden group-hover:block top-full left-0 bg-app-surface border border-app-border shadow-lg py-1 z-50 w-48">
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="toggleTheme">Toggle Light/Dark Theme</div>
          <div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="showConfig = true">GUI Config Editor</div>
        </div>
      </div>
    </header>

    <!-- Main Content Resizable Panes -->
    <div class="flex-1 flex overflow-hidden" @click="closeContextMenu" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag">
      
      <!-- Left Pane (TreeView) -->
      <div :style="{ width: leftPaneWidth + 'px' }" class="bg-app-panel overflow-y-auto shrink-0 font-ui">
        <div class="p-2 h-full" @contextmenu.prevent="onPaneContextMenu">
          <div v-for="db in store.databases" :key="db.id" class="mb-2 select-none">
            <div class="flex items-center space-x-2 font-bold cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 p-1.5 rounded transition-colors" 
                 :class="{'bg-gray-200 dark:bg-gray-700': store.currentDb === db.id}" 
                 @click="selectDb(db)" 
                 @contextmenu.stop.prevent="onDbContextMenu($event, db)">
              <svg class="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              <span class="truncate">{{ db.description }}</span>
            </div>
            <div v-show="store.currentDb === db.id" class="mt-1">
              <TreeView :nodes="categoryTree" :currentId="store.currentCategoryId" @select="onCategorySelect" @toggle="onCategoryToggle" @contextmenu="onCategoryContextMenu" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Vertical Resizer -->
      <div class="w-1 cursor-col-resize hover:bg-[var(--color-primary)] bg-gray-300 dark:bg-gray-700 z-10 transition-colors" @mousedown="startDrag('vertical')"></div>

      <!-- Right Pane (Table + Details) -->
      <div class="flex-1 flex flex-col min-w-0">
        
        <!-- Top Right Pane (Table) -->
        <div :style="{ height: topPaneHeight + 'px' }" class="bg-app-surface overflow-auto shrink-0 relative">
          <BookTable v-if="store.currentCategoryId !== null" :books="store.books" :selectedId="store.selectedBook?.id" @select="store.selectBook" @edit="openEditBookModal" @contextmenu="onBookContextMenu" @contextmenu-empty="onTableContextMenu" />
          <div v-else class="absolute inset-0 flex items-center justify-center text-app-text-muted bg-app-surface z-20">
            Select a category to view books
          </div>
        </div>
        
        <!-- Horizontal Resizer -->
        <div class="h-1 cursor-row-resize hover:bg-[var(--color-primary)] bg-gray-300 dark:bg-gray-700 z-10 transition-colors" @mousedown="startDrag('horizontal')"></div>

        <!-- Bottom Right Pane (Details) -->
        <div v-if="store.selectedBook" class="flex-1 bg-app-bg overflow-y-auto p-4 min-h-0">
          <BookDetail :book="store.selectedBook" :cover="store.bookCover" />
        </div>
        <div v-else class="flex-1 bg-app-bg flex items-center justify-center text-app-text-muted min-h-0">
          Select a book to view details
        </div>
      </div>
    </div>
  

    <!-- Context Menu -->
    <div v-if="contextMenu.show" :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }" class="fixed bg-app-surface border border-app-border shadow-lg py-1 z-[100] w-48 font-menu rounded shadow-xl">
      <div v-if="contextMenu.type === 'pane'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="handleContextMenu('createDb')">Create Database</div>
      <div v-if="contextMenu.type === 'pane'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="handleContextMenu('openDb')">Open Database</div>
      
      <div v-if="contextMenu.type === 'db'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500" @click="handleContextMenu('closeDb')">Close Database</div>
      <div v-if="contextMenu.type === 'db'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-t border-gray-200 dark:border-gray-600 mt-1 pt-1" @click="handleContextMenu('addCategory')">Add Category</div>

      <div v-if="contextMenu.type === 'category'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="handleContextMenu('addBook')">Add Book to Category</div>
      <div v-if="contextMenu.type === 'category'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 mb-1 pb-1" @click="handleContextMenu('addCategory')">Add Sub-category</div>
      <div v-if="contextMenu.type === 'category'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500" @click="handleContextMenu('deleteCategory')">Delete Category</div>
      
      <div v-if="contextMenu.type === 'book'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="handleContextMenu('editBook')">Edit Book</div>
      <div v-if="contextMenu.type === 'book'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500" @click="handleContextMenu('deleteBook')">Delete Book</div>

      <div v-if="contextMenu.type === 'table'" class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="handleContextMenu('addBook')">Add New Book</div>
    </div>

    <!-- Modals -->
    <div v-if="showConfig" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-app-surface p-6 rounded shadow-lg w-[32rem] max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl mb-4 font-bold">UI Configuration</h2>
        
        <div class="space-y-4">
          <!-- General -->
          <div class="p-3 border rounded border-app-border">
            <h3 class="font-semibold mb-2">Theme Color</h3>
            <div class="flex flex-wrap gap-3">
              <button 
                v-for="color in themeColors" 
                :key="color.value"
                @click="config.primaryColor = color.value; applyConfig()"
                class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none"
                :class="config.primaryColor === color.value ? 'border-gray-900 dark:border-white shadow-lg' : 'border-transparent'"
                :style="{ backgroundColor: color.value }"
                :title="color.name"
              ></button>
            </div>
            
            <h3 class="font-semibold border-b border-app-border pb-1 mt-4">Interface Colors</h3>
            <div class="grid grid-cols-2 gap-4 mt-2">
              <div class="space-y-2">
                <h4 class="text-sm font-medium text-app-text-muted">Light Mode</h4>
                <label class="flex justify-between items-center text-sm"><span>Background</span> <input type="color" v-model="config.bgLight" @change="applyConfig"></label>
                <label class="flex justify-between items-center text-sm"><span>Panel</span> <input type="color" v-model="config.panelLight" @change="applyConfig"></label>
                <label class="flex justify-between items-center text-sm"><span>Surface</span> <input type="color" v-model="config.surfaceLight" @change="applyConfig"></label>
                <label class="flex justify-between items-center text-sm"><span>Text</span> <input type="color" v-model="config.textLight" @change="applyConfig"></label>
                <label class="flex justify-between items-center text-sm"><span>Muted Text</span> <input type="color" v-model="config.textMutedLight" @change="applyConfig"></label>
                <label class="flex justify-between items-center text-sm"><span>Border</span> <input type="color" v-model="config.borderLight" @change="applyConfig"></label>
              </div>
              <div class="space-y-2">
                <h4 class="text-sm font-medium text-app-text-muted">Dark Mode</h4>
                <label class="flex justify-between items-center text-sm"><span>Background</span> <input type="color" v-model="config.bgDark" @change="applyConfig"></label>
                <label class="flex justify-between items-center text-sm"><span>Panel</span> <input type="color" v-model="config.panelDark" @change="applyConfig"></label>
                <label class="flex justify-between items-center text-sm"><span>Surface</span> <input type="color" v-model="config.surfaceDark" @change="applyConfig"></label>
                <label class="flex justify-between items-center text-sm"><span>Text</span> <input type="color" v-model="config.textDark" @change="applyConfig"></label>
                <label class="flex justify-between items-center text-sm"><span>Muted Text</span> <input type="color" v-model="config.textMutedDark" @change="applyConfig"></label>
                <label class="flex justify-between items-center text-sm"><span>Border</span> <input type="color" v-model="config.borderDark" @change="applyConfig"></label>
              </div>
            </div>
          </div>

          <!-- Fonts -->
          <div class="p-3 border rounded border-app-border space-y-3">
            <h3 class="font-semibold border-b border-app-border pb-1">Book Info Font (Base)</h3>
            <div class="flex space-x-2">
              <label class="flex flex-col space-y-1 flex-1">
                <span class="text-sm">Family</span>
                <input v-model="config.bookFontFamily" @change="applyConfig" class="p-1 border rounded bg-app-surface border-app-border" placeholder="e.g. Times New Roman, Georgia, serif" />
              </label>
              <label class="flex flex-col space-y-1 flex-1">
                <span class="text-sm">Size (px)</span>
                <input type="number" v-model="config.bookFontSize" @change="applyConfig" class="p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
              </label>
            </div>

            <h3 class="font-semibold border-b dark:border-gray-600 pb-1 mt-2">Menu Bar Font</h3>
            <div class="flex space-x-2">
              <label class="flex flex-col space-y-1 flex-1">
                <span class="text-sm">Family</span>
                <input v-model="config.menuFontFamily" @change="applyConfig" class="p-1 border rounded bg-app-surface border-app-border" placeholder="e.g. system-ui, -apple-system, Segoe UI, sans-serif" />
              </label>
              <label class="flex flex-col space-y-1 flex-1">
                <span class="text-sm">Relative Size (em)</span>
                <input type="number" step="0.1" v-model="config.menuFontSize" @change="applyConfig" class="p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
              </label>
            </div>

            <h3 class="font-semibold border-b dark:border-gray-600 pb-1 mt-2">UI Font</h3>
            <div class="flex space-x-2">
              <label class="flex flex-col space-y-1 flex-1">
                <span class="text-sm">Family</span>
                <input v-model="config.uiFontFamily" @change="applyConfig" class="p-1 border rounded bg-app-surface border-app-border" placeholder="e.g. Inter, system-ui, sans-serif" />
              </label>
              <label class="flex flex-col space-y-1 flex-1">
                <span class="text-sm">Relative Size (em)</span>
                <input type="number" step="0.1" v-model="config.uiFontSize" @change="applyConfig" class="p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
              </label>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-2 mt-6">
          <button @click="showConfig = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Close</button>
          <button @click="saveConfig" class="px-4 py-2 rounded bg-[var(--color-primary)] text-white">Save</button>
        </div>
      </div>
    </div>

    <!-- DB Modals -->
    <div v-if="showCreateDb" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-app-surface p-6 rounded shadow-lg w-96">
        <h2 class="text-xl mb-4">Create Database</h2>
        <input v-model="dbDescription" placeholder="Database Description (e.g., My Library)" class="w-full mb-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
        <div class="flex items-center space-x-2 mb-4">
          <input v-model="dbPath" placeholder="Select save location..." readonly class="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 cursor-not-allowed" />
          <button @click="selectSavePath" class="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Browse</button>
        </div>
        <div class="flex justify-end space-x-2">
          <button @click="showCreateDb = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          <button @click="doCreateDb" class="px-4 py-2 rounded bg-[var(--color-primary)] text-white" :disabled="!dbDescription || !dbPath">Create</button>
        </div>
      </div>
    </div>

    <div v-if="showOpenDb" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-app-surface p-6 rounded shadow-lg w-96">
        <h2 class="text-xl mb-4">Open Database</h2>
        <div class="flex items-center space-x-2 mb-4">
          <input v-model="dbPath" placeholder="Select .db file..." readonly class="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 cursor-not-allowed" />
          <button @click="selectOpenPath" class="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Browse</button>
        </div>
        <div class="flex justify-end space-x-2">
          <button @click="showOpenDb = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          <button @click="doOpenDb" class="px-4 py-2 rounded bg-[var(--color-primary)] text-white" :disabled="!dbPath">Open</button>
        </div>
      </div>
    </div>

    <!-- Category Modal -->
    <div v-if="showAddCategory" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-app-surface p-6 rounded shadow-lg w-96">
        <h2 class="text-xl mb-4">Add Category</h2>
        <p class="mb-2 text-sm text-app-text-muted" v-if="contextMenu.type === 'category'">Parent: {{ contextMenu.nodeName }}</p>
        <p class="mb-2 text-sm text-app-text-muted" v-else>Parent: Root</p>
        <input v-model="categoryName" @keyup.enter="doAddCategory" placeholder="Category Name" class="w-full mb-4 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
        <div class="flex justify-end space-x-2">
          <button @click="showAddCategory = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          <button @click="doAddCategory" class="px-4 py-2 rounded bg-[var(--color-primary)] text-white">Add</button>
        </div>
      </div>
    </div>

    <!-- Add Book Modal -->
    <div v-if="showAddBook" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-app-surface p-6 rounded shadow-lg w-[500px] max-h-screen overflow-y-auto">
        <h2 class="text-xl mb-4">{{ bookForm.id ? 'Edit Book' : 'Add New Book' }}</h2>
        <div class="space-y-3">
          <input v-model="bookForm.title" placeholder="Title" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <input v-model="bookForm.author" placeholder="Author" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <input v-model="bookForm.publisher" placeholder="Publisher" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <input v-model="bookForm.isbn" placeholder="ISBN" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <input v-model="bookForm.edition" placeholder="Edition" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          <div class="flex items-center space-x-2">
            <input v-model="bookForm.local_path" placeholder="Local Path" class="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
            <button @click="selectLocalPath" class="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Browse</button>
          </div>
          <textarea v-model="bookForm.notes" placeholder="Notes" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 h-20"></textarea>
          
          <div class="border border-dashed border-gray-400 p-4 rounded space-y-3">
            <div class="text-center">
              <label class="cursor-pointer">
                <span class="text-blue-500 hover:underline">Upload Local Cover Image</span>
                <input type="file" accept="image/*" @change="onCoverChange" class="hidden" />
              </label>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-app-text-muted text-sm font-semibold">OR</span>
              <input v-model="bookForm.coverUrl" placeholder="Paste Image URL here..." class="flex-1 p-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600" />
              <button @click="fetchCoverUrl" type="button" class="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600" :disabled="isFetchingCover">
                {{ isFetchingCover ? 'Fetching...' : 'Fetch' }}
              </button>
            </div>
            <div v-if="bookForm.coverName" class="text-xs text-center text-green-600 dark:text-green-400 mt-2 font-medium">Ready: {{ bookForm.coverName }}</div>
          </div>
          
          <div class="border border-dashed border-gray-400 p-4 text-center rounded">
            <textarea v-model="bookForm.bibtex" placeholder="Or paste BibTeX here to import" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm h-24"></textarea>
          </div>
        </div>
        
        <div class="flex justify-end space-x-2 mt-4">
          <button @click="showAddBook = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          <button @click="doAddBook" class="px-4 py-2 rounded bg-[var(--color-primary)] text-white">{{ bookForm.id ? 'Save' : 'Add' }}</button>
        </div>
      </div>
    </div>

    <!-- Confirm Modal -->
    <div v-if="confirmModal.show" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[200]">
      <div class="bg-app-surface p-6 rounded shadow-lg w-96 transform transition-all">
        <div class="flex items-center space-x-3 mb-4 text-red-500">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 class="text-xl font-bold text-app-text">{{ confirmModal.title }}</h2>
        </div>
        <p class="mb-6 text-app-text-muted">{{ confirmModal.message }}</p>
        <div class="flex justify-end space-x-3">
          <button @click="confirmModal.resolve(false); confirmModal.show = false" class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">Cancel</button>
          <button @click="confirmModal.resolve(true); confirmModal.show = false" class="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-medium transition-colors">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useLibraryStore } from './store';
import TreeView from './components/TreeView.vue';
import BookTable from './components/BookTable.vue';
import BookDetail from './components/BookDetail.vue';
import { invoke } from '@tauri-apps/api/core';
import { save, open } from '@tauri-apps/plugin-dialog';

const store = useLibraryStore();

// Custom Resizer Logic
const leftPaneWidth = ref(300);
const topPaneHeight = ref(400);
const dragging = ref<'vertical' | 'horizontal' | null>(null);

const startDrag = (type: 'vertical' | 'horizontal') => {
  dragging.value = type;
  document.body.style.userSelect = 'none'; // Prevent text selection while dragging
};

const onDrag = (e: MouseEvent) => {
  if (dragging.value === 'vertical') {
    leftPaneWidth.value = Math.max(150, Math.min(e.clientX, window.innerWidth - 300));
  } else if (dragging.value === 'horizontal') {
    // 32 is the height of the header
    topPaneHeight.value = Math.max(100, Math.min(e.clientY - 32, window.innerHeight - 150));
  }
};

const stopDrag = () => {
  if (dragging.value) {
    dragging.value = null;
    document.body.style.userSelect = '';
  }
};


const showCreateDb = ref(false);
const showOpenDb = ref(false);
const showAddBook = ref(false);
const showAddCategory = ref(false);
const dbDescription = ref('');
const dbPath = ref('');
const categoryName = ref('');

const showConfig = ref(false);
const config = ref({
  darkMode: false,
  primaryColor: '#3b82f6',
  bgLight: '#f9fafb',
  panelLight: '#f3f4f6',
  bgDark: '#111827',
  panelDark: '#1f2937',
  surfaceLight: '#ffffff',
  surfaceDark: '#1f2937',
  textLight: '#111827',
  textDark: '#f3f4f6',
  textMutedLight: '#4b5563',
  textMutedDark: '#9ca3af',
  borderLight: '#e5e7eb',
  borderDark: '#374151',
  bookFontSize: 16,
  menuFontFamily: 'sans-serif',
  menuFontSize: 1.0,
  uiFontFamily: 'sans-serif',
  uiFontSize: 1.25,
  bookFontFamily: 'serif'
});

const toggleTheme = async () => {
  config.value.darkMode = !config.value.darkMode;
  applyConfig();
  await saveConfig();
};

const themeColors = [
  { name: 'Blue (Default)', value: '#3b82f6' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Purple', value: '#9333ea' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Emerald', value: '#ca8a04' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Cyan', value: '#0891b2' },
  { name: 'Slate', value: '#475569' },
];

const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  type: 'db', // 'db', 'category', 'pane'
  nodeId: null as number | null,
  nodeName: ''
});

const confirmModal = ref({
  show: false,
  title: '',
  message: '',
  resolve: (v: boolean) => { v; }
});

const customConfirm = (message: string, title: string = 'Confirm Action'): Promise<boolean> => {
  return new Promise((resolve) => {
    confirmModal.value = {
      show: true,
      title,
      message,
      resolve
    };
  });
};

const customStyle = computed(() => {
  const menuFontFamily = config.value.menuFontFamily?.trim() || 'sans-serif';
  const uiFontFamily = config.value.uiFontFamily?.trim() || 'sans-serif';
  const bookFontFamily = config.value.bookFontFamily?.trim() || 'serif';
  return {
    '--color-primary': config.value.primaryColor,
    '--config-bg': config.value.darkMode ? config.value.bgDark : config.value.bgLight,
    '--config-panel': config.value.darkMode ? config.value.panelDark : config.value.panelLight,
    '--config-surface': config.value.darkMode ? config.value.surfaceDark : config.value.surfaceLight,
    '--config-text': config.value.darkMode ? config.value.textDark : config.value.textLight,
    '--config-text-muted': config.value.darkMode ? config.value.textMutedDark : config.value.textMutedLight,
    '--config-border': config.value.darkMode ? config.value.borderDark : config.value.borderLight,
    '--font-book-size': config.value.bookFontSize + 'px',
    '--font-menu-family': menuFontFamily,
    '--font-menu-size': config.value.menuFontSize + 'em',
    '--font-ui-family': uiFontFamily,
    '--font-ui-size': config.value.uiFontSize + 'em',
    '--font-book-family': bookFontFamily,
  }
});

onMounted(async () => {
  store.loadDatabases();
  try {
    const confStr = await invoke('read_config');
    const conf = JSON.parse(confStr as string);
    if (conf.darkMode !== undefined) config.value.darkMode = conf.darkMode;
    if (conf.primaryColor !== undefined) config.value.primaryColor = conf.primaryColor;
    if (conf.bgLight !== undefined) config.value.bgLight = conf.bgLight;
    if (conf.bgDark !== undefined) config.value.bgDark = conf.bgDark;
    if (conf.panelLight !== undefined) config.value.panelLight = conf.panelLight;
    if (conf.panelDark !== undefined) config.value.panelDark = conf.panelDark;
    if (conf.surfaceLight !== undefined) config.value.surfaceLight = conf.surfaceLight;
    if (conf.surfaceDark !== undefined) config.value.surfaceDark = conf.surfaceDark;
    if (conf.textLight !== undefined) config.value.textLight = conf.textLight;
    if (conf.textDark !== undefined) config.value.textDark = conf.textDark;
    if (conf.textMutedLight !== undefined) config.value.textMutedLight = conf.textMutedLight;
    if (conf.textMutedDark !== undefined) config.value.textMutedDark = conf.textMutedDark;
    if (conf.borderLight !== undefined) config.value.borderLight = conf.borderLight;
    if (conf.borderDark !== undefined) config.value.borderDark = conf.borderDark;
    if (conf.bookFontSize !== undefined) config.value.bookFontSize = conf.bookFontSize;
    else if (conf.fontSize !== undefined) config.value.bookFontSize = conf.fontSize; // migrate old
    if (conf.menuFontFamily !== undefined) config.value.menuFontFamily = conf.menuFontFamily;
    if (conf.menuFontSize !== undefined) config.value.menuFontSize = conf.menuFontSize;
    if (conf.uiFontFamily !== undefined) config.value.uiFontFamily = conf.uiFontFamily;
    if (conf.uiFontSize !== undefined) config.value.uiFontSize = conf.uiFontSize;
    if (conf.bookFontFamily !== undefined) config.value.bookFontFamily = conf.bookFontFamily;
    applyConfig();
  } catch (e) {}
});

const applyConfig = () => {
  if (config.value.darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const saveConfig = async () => {
  await invoke('save_config', { config: JSON.stringify(config.value) });
  showConfig.value = false;
};

const expandedCategoryIds = ref<number[]>([]);

const onCategoryToggle = (node: any) => {
  const index = expandedCategoryIds.value.indexOf(node.id);
  if (index === -1) {
    expandedCategoryIds.value.push(node.id);
  } else {
    expandedCategoryIds.value.splice(index, 1);
  }
};

const categoryTree = computed(() => {
  const map = new Map();
  const roots: any[] = [];
  store.categories.forEach(c => map.set(c.id, { ...c, children: [], isOpen: expandedCategoryIds.value.includes(c.id) }));
  store.categories.forEach(c => {
    if (c.parent_id) {
      const parent = map.get(c.parent_id);
      if (parent) parent.children.push(map.get(c.id));
    } else {
      roots.push(map.get(c.id));
    }
  });
  return roots;
});

const selectDb = (db: any) => {
  store.currentDb = db.id;
  expandedCategoryIds.value = [];
  store.fetchCategories();
  store.fetchBooks(null);
};

const onCategorySelect = (node: any) => {
  store.fetchBooks(node.id);
};

// Context Menu Logic
const closeContextMenu = () => {
  contextMenu.value.show = false;
};

const onPaneContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    type: 'pane',
    nodeId: null,
    nodeName: 'Pane'
  };
};

const onDbContextMenu = (event: MouseEvent, db: any) => {
  event.preventDefault();
  store.currentDb = db.id;
  store.fetchCategories();
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    type: 'db',
    nodeId: db.id,
    nodeName: db.description
  };
};

const onCategoryContextMenu = ({ event, node }: any) => {
  event.preventDefault();
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    type: 'category',
    nodeId: node.id,
    nodeName: node.name
  };
};

const onTableContextMenu = (event: MouseEvent) => {
  if (store.currentCategoryId === null) return;
  event.preventDefault();
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    type: 'table',
    nodeId: store.currentCategoryId,
    nodeName: 'Table'
  };
};

const handleDeleteCategory = async (categoryId: number) => {
  if (!store.currentDb) return;
  try {
    const count = await invoke('count_books_in_category', { dbName: store.currentDb, categoryId }) as number;
    if (count > 0) {
      const yes = await customConfirm(`This category and its sub-categories contain ${count} books. Are you sure you want to delete them all?`, 'Confirm Deletion');
      if (!yes) return;
    }
    await invoke('delete_category', { dbName: store.currentDb, categoryId });
    store.fetchCategories();
    store.fetchBooks(null);
  } catch(e) { console.error(e) }
};

const handleContextMenu = async (action: string) => {
  const currentAction = action;
  const menuData = { ...contextMenu.value };
  closeContextMenu();

  try {
    if (currentAction === 'addCategory') {
      categoryName.value = '';
      showAddCategory.value = true;
    } else if (currentAction === 'addBook') {
      store.currentCategoryId = menuData.nodeId as number;
      openAddBookModal();
    } else if (currentAction === 'createDb') {
      dbDescription.value = '';
      dbPath.value = '';
      showCreateDb.value = true;
    } else if (currentAction === 'openDb') {
      dbPath.value = '';
      showOpenDb.value = true;
    } else if (currentAction === 'closeDb') {
      await store.closeDatabase(menuData.nodeId as unknown as string);
    } else if (currentAction === 'editBook') {
      const book = store.books.find(b => b.id === menuData.nodeId);
      if (book) openEditBookModal(book);
    } else if (currentAction === 'deleteBook') {
      try {
        const yes = await customConfirm(`Are you sure you want to delete "${menuData.nodeName}"?`, 'Confirm Deletion');
        if (yes) {
          await invoke('delete_book', { dbName: store.currentDb, id: Number(menuData.nodeId) });
          await store.fetchBooks(store.currentCategoryId);
        }
      } catch (err) {
        alert('Failed to delete book: ' + JSON.stringify(err));
      }
    } else if (currentAction === 'deleteCategory') {
      await handleDeleteCategory(menuData.nodeId as number);
    }
  } catch (e) {
    console.error('Context menu action failed:', e);
  }
};

const doAddCategory = async () => {
  if (categoryName.value.trim()) {
    const parentId = contextMenu.value.type === 'category' ? contextMenu.value.nodeId as number : null;
    await store.addCategory(parentId, categoryName.value.trim());
    categoryName.value = '';
    showAddCategory.value = false;
  }
};

const selectSavePath = async () => {
  const filePath = await save({
    filters: [{ name: 'Database', extensions: ['db', 'sqlite'] }]
  });
  if (filePath) {
    dbPath.value = filePath;
  }
};

const selectOpenPath = async () => {
  const filePath = await open({
    filters: [{ name: 'Database', extensions: ['db', 'sqlite'] }]
  });
  if (filePath) {
    // If it's an array, take the first element (though open defaults to single selection)
    dbPath.value = Array.isArray(filePath) ? filePath[0] : filePath;
  }
};

const doCreateDb = async () => {
  if (!dbDescription.value || !dbPath.value) return;
  await store.createDatabase(dbDescription.value, dbPath.value);
  showCreateDb.value = false;
  dbDescription.value = '';
  dbPath.value = '';
};

const doOpenDb = async () => {
  if (!dbPath.value) return;
  await store.openDatabase(dbPath.value);
  showOpenDb.value = false;
  dbPath.value = '';
};

const exportBibtex = async () => {
  if (!store.currentDb) return;
  try {
    const bib = await invoke('export_bibtex', { dbName: store.currentDb, categoryId: null });
    
    // Create a Blob and trigger download in browser
    const blob = new Blob([bib as string], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library_export.bib';
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
  }
};

// Add Book Logic
const isFetchingCover = ref(false);
const bookForm = ref({
  id: null as number | null,
  title: '', author: '', publisher: '', isbn: '', edition: '', local_path: '', notes: '', bibtex: '', coverBytes: [] as number[], coverName: '', coverUrl: ''
});

const openAddBookModal = () => {
  if (store.currentCategoryId === null) {
    alert('Please select a specific category first to add a book.');
    return;
  }
  bookForm.value = { id: null, title: '', author: '', publisher: '', isbn: '', edition: '', local_path: '', notes: '', bibtex: '', coverBytes: [], coverName: '', coverUrl: '' };
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
    coverName: '',
    coverUrl: ''
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
};

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

const fetchCoverUrl = async () => {
  const url = bookForm.value.coverUrl.trim();
  if (!url) return;
  
  isFetchingCover.value = true;
  try {
    const bytes = await invoke('fetch_image_url', { url }) as number[];
    bookForm.value.coverBytes = bytes;
    bookForm.value.coverName = 'URL Image Loaded';
  } catch (error) {
    console.error('Failed to fetch image:', error);
    alert('Failed to fetch image from URL: ' + error);
  } finally {
    isFetchingCover.value = false;
  }
};

const selectLocalPath = async () => {
  const filePath = await open({
    multiple: false,
    directory: false,
  });
  if (filePath) {
    bookForm.value.local_path = Array.isArray(filePath) ? filePath[0] : filePath;
  }
};

const doAddBook = async () => {
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
        coverBytes: bookForm.value.coverBytes,
        notes: bookForm.value.notes
      });
    } else {
      if (bookForm.value.bibtex.trim() !== '') {
        await invoke('import_bibtex', { 
          dbName: store.currentDb, 
          categoryId: targetCategory, 
          bibtexContent: bookForm.value.bibtex,
          localPath: bookForm.value.local_path,
          coverBytes: bookForm.value.coverBytes,
          formNotes: bookForm.value.notes,
          formTitle: bookForm.value.title,
          formAuthor: bookForm.value.author,
          formPublisher: bookForm.value.publisher,
          formIsbn: bookForm.value.isbn,
          formEdition: bookForm.value.edition
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
    await store.fetchBooks(store.currentCategoryId);
    
    // Refresh the selected book's cover if it was the one being edited
    if (bookForm.value.id === store.selectedBook?.id) {
      const updatedBook = store.books.find(b => b.id === bookForm.value.id);
      if (updatedBook) {
        store.selectBook(updatedBook);
      }
    }
  } catch (e) {
    console.error(e);
  }
};
</script>
