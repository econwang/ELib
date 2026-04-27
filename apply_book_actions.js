const fs = require('fs');

// 1. UPDATE commands.rs (import_bibtex)
let commandsRs = fs.readFileSync('/workspace/e-lib-pro/src-tauri/src/commands.rs', 'utf-8');
commandsRs = commandsRs.replace(
  /for entry in bibliography\.iter\(\) \{[\s\S]*?conn\.execute\("INSERT INTO books \(category_id, title, author\) VALUES \(\?1, \?2, \?3\)", params!\[category_id, title, author\]\)\.map_err\(\|e\| e\.to_string\(\)\)\?;/g,
  `for entry in bibliography.iter() {
        let title = match entry.title() {
            Ok(chunks) => chunks.format_verbatim(),
            _ => String::new(),
        };

        let author = match entry.author() {
            Ok(persons) => {
                let mut names = Vec::new();
                for person in persons {
                    names.push(person.name);
                }
                names.join(" and ")
            },
            _ => String::new(),
        };

        let publisher = entry.get("publisher").map(|c| c.format_verbatim()).unwrap_or_default();
        let isbn = entry.get("isbn").map(|c| c.format_verbatim()).unwrap_or_default();
        let edition = entry.get("edition").map(|c| c.format_verbatim()).unwrap_or_default();
        let note = entry.get("note").map(|c| c.format_verbatim()).unwrap_or_default();

        conn.execute("INSERT INTO books (category_id, title, author, publisher, isbn, edition, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)", params![category_id, title, author, publisher, isbn, edition, note]).map_err(|e| e.to_string())?;`
);
fs.writeFileSync('/workspace/e-lib-pro/src-tauri/src/commands.rs', commandsRs);

// 2. UPDATE store.ts
let storeTs = fs.readFileSync('/workspace/e-lib-pro/src/store.ts', 'utf-8');

// Add currentCategoryId
storeTs = storeTs.replace(
  /const currentDb = ref<string \| null>\(null\)/,
  `const currentDb = ref<string | null>(null)\n  const currentCategoryId = ref<number | null>(null)`
);

storeTs = storeTs.replace(
  /const fetchBooks = async \(categoryId: number \| null\) => \{/,
  `const fetchBooks = async (categoryId: number | null) => {\n    currentCategoryId.value = categoryId;`
);

storeTs = storeTs.replace(
  /currentDb\.value = path\n      await fetchCategories\(\)\n      await fetchBooks\(null\)/g,
  `currentDb.value = path\n      currentCategoryId.value = null\n      await fetchCategories()\n      await fetchBooks(null)`
);

storeTs = storeTs.replace(
  /if \(databases\.value\.length > 0\) \{\n          await openDatabase\(databases\.value\[0\]\.path\);\n        \}/,
  `currentCategoryId.value = null;\n        if (databases.value.length > 0) {\n          await openDatabase(databases.value[0].path);\n        }`
);

storeTs = storeTs.replace(
  /databases, currentDb, categories, books, selectedBook, bookCover,/,
  `databases, currentDb, currentCategoryId, categories, books, selectedBook, bookCover,`
);

fs.writeFileSync('/workspace/e-lib-pro/src/store.ts', storeTs);


// 3. UPDATE BookTable.vue
let bookTableVue = fs.readFileSync('/workspace/e-lib-pro/src/components/BookTable.vue', 'utf-8');
bookTableVue = bookTableVue.replace(
  /<tr v-for="row in table\.getRowModel\(\)\.rows" :key="row\.id" @click="\$emit\('select', row\.original\)" class="hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors">/,
  `<tr v-for="row in table.getRowModel().rows" :key="row.id" @click="$emit('select', row.original)" @dblclick="$emit('edit', row.original)" @contextmenu.prevent="$emit('contextmenu', { event: $event, book: row.original })" class="hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors">`
);

bookTableVue = bookTableVue.replace(
  /defineEmits\(\['select'\]\);/,
  `defineEmits(['select', 'edit', 'contextmenu']);`
);

// Add Authors Tag formatting
bookTableVue = bookTableVue.replace(
  /<td v-for="cell in row\.getVisibleCells\(\)" :key="cell\.id" :style="\{ width: cell\.column\.getSize\(\) \+ 'px' \}" class="p-2 truncate overflow-hidden">[\s\S]*?<\/td>/,
  `<td v-for="cell in row.getVisibleCells()" :key="cell.id" :style="{ width: cell.column.getSize() + 'px' }" class="p-2 truncate overflow-hidden">
            <template v-if="cell.column.id === 'author'">
              <div class="flex flex-wrap gap-1">
                <span v-for="(author, i) in String(cell.getValue() || '').split(/\\s+and\\s+|,/).filter(a => a.trim() !== 'and' && a.trim() !== '')" :key="i" class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                  {{ author.trim() }}
                </span>
              </div>
            </template>
            <template v-else>
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </template>
          </td>`
);

fs.writeFileSync('/workspace/e-lib-pro/src/components/BookTable.vue', bookTableVue);

// 4. UPDATE BookDetail.vue
let bookDetailVue = fs.readFileSync('/workspace/e-lib-pro/src/components/BookDetail.vue', 'utf-8');
bookDetailVue = bookDetailVue.replace(
  /<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Author: \{\{ book\.author \}\}<\/p>/,
  `<div class="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
            <span>Author:</span>
            <div class="flex flex-wrap gap-1">
              <span v-for="(author, i) in String(book.author || '').split(/\\s+and\\s+|,/).filter(a => a.trim() !== 'and' && a.trim() !== '')" :key="i" class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                {{ author.trim() }}
              </span>
            </div>
          </div>`
);
fs.writeFileSync('/workspace/e-lib-pro/src/components/BookDetail.vue', bookDetailVue);

