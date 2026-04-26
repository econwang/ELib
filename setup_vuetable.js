const fs = require('fs');

const bookTableVue = `
<template>
  <div class="h-full w-full overflow-auto">
    <table class="w-full text-left border-collapse whitespace-nowrap" :style="{ width: table.getTotalSize() + 'px' }">
      <thead class="bg-gray-100 dark:bg-gray-800 sticky top-0 shadow-sm z-10">
        <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <th v-for="header in headerGroup.headers" :key="header.id" :style="{ width: header.getSize() + 'px' }" class="p-2 border-b border-gray-300 dark:border-gray-700 font-semibold text-sm relative group">
            <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
            <div
              @mousedown="header.getResizeHandler()($event)"
              @touchstart="header.getResizeHandler()($event)"
              class="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-500 opacity-0 group-hover:opacity-100"
              :class="{ 'bg-blue-500 opacity-100': header.column.getIsResizing() }"
            ></div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in table.getRowModel().rows" :key="row.id" @click="$emit('select', row.original)" class="hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors">
          <td v-for="cell in row.getVisibleCells()" :key="cell.id" :style="{ width: cell.column.getSize() + 'px' }" class="p-2 truncate overflow-hidden">
            <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
          </td>
        </tr>
        <tr v-if="!books || books.length === 0">
          <td :colspan="columns.length" class="p-8 text-center text-gray-500">No books found in this category.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  useVueTable,
  getCoreRowModel,
  FlexRender,
  ColumnDef,
} from '@tanstack/vue-table';

const props = defineProps<{ books: any[] }>();
defineEmits(['select']);

const columns: ColumnDef<any>[] = [
  { accessorKey: 'title', header: 'Title', size: 300 },
  { accessorKey: 'author', header: 'Author', size: 200 },
  { accessorKey: 'publisher', header: 'Publisher', size: 150 },
  { accessorKey: 'isbn', header: 'ISBN', size: 150 },
  { accessorKey: 'edition', header: 'Edition', size: 100 },
];

const table = useVueTable({
  get data() { return props.books || [] },
  columns,
  getCoreRowModel: getCoreRowModel(),
  columnResizeMode: 'onChange',
});
</script>
`;

fs.writeFileSync('/workspace/e-lib-pro/src/components/BookTable.vue', bookTableVue.trim());
