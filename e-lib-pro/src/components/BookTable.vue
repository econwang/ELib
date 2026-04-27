<template>
  <div class="h-full w-full overflow-auto flex flex-col bg-white dark:bg-gray-900" ref="containerRef" @click="$emit('select', null)" @contextmenu.prevent="$emit('contextmenu-empty', $event)">
    <table class="w-full text-left border-collapse whitespace-nowrap table-fixed">
      <thead class="bg-gray-100 dark:bg-gray-800 sticky top-0 shadow-sm z-10">
        <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <th v-for="header in headerGroup.headers" :key="header.id" :style="{ width: header.getSize() + 'px' }" class="p-2 border-b border-gray-300 dark:border-gray-700 font-semibold font-ui relative group select-none">
            <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
            <div
              @mousedown.stop="header.getResizeHandler()($event)"
              @touchstart.stop="header.getResizeHandler()($event)"
              class="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-500 opacity-0 group-hover:opacity-100"
              :class="{ 'bg-blue-500 opacity-100': header.column.getIsResizing() }"
            ></div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in table.getRowModel().rows" :key="row.id" 
            @click.stop="$emit('select', row.original)" 
            @dblclick.stop="$emit('edit', row.original)" 
            @contextmenu.prevent.stop="$emit('contextmenu', { event: $event, book: row.original })" 
            class="cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors"
            :class="[selectedId === row.original.id ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-blue-50 dark:hover:bg-gray-800']">
          <td v-for="cell in row.getVisibleCells()" :key="cell.id" class="p-2 truncate overflow-hidden font-book">
            <template v-if="cell.column.id === 'author'">
              <div class="flex flex-wrap gap-1">
                <span v-for="(author, i) in String(cell.getValue() || '').split(';').filter(a => a.trim() !== '')" :key="i" 
                      class="px-2 py-0.5 rounded-full transition-colors font-book" style="font-size: 0.85em;"
                      :class="[selectedId === row.original.id ? 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200']">
                  {{ 
                    (() => {
                      const name = author.trim();
                      const parts = name.split(' ');
                      if (parts.length > 1) {
                        // Abbreviate first names, keep last name full
                        const last = parts.pop();
                        const initials = parts.map(p => p.charAt(0).toUpperCase() + '.').join(' ');
                        return `${initials} ${last}`;
                      }
                      return name;
                    })()
                  }}
                </span>
              </div>
            </template>
            <template v-else>
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </template>
          </td>
        </tr>
        <tr v-if="!books || books.length === 0">
          <td :colspan="columns.length" class="p-8 text-center text-gray-500">No books found.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useVueTable, getCoreRowModel, FlexRender } from '@tanstack/vue-table';
import type { ColumnDef } from '@tanstack/vue-table';
import { invoke } from '@tauri-apps/api/core';

const props = defineProps<{ books: any[], selectedId?: number | null }>();
defineEmits(['select', 'edit', 'contextmenu', 'contextmenu-empty']);

const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref(1000);

const resizeObserver = new ResizeObserver((entries) => {
  for (let entry of entries) {
    if (entry.contentRect.width > 0) {
      containerWidth.value = entry.contentRect.width;
      updateColumnSizes();
    }
  }
});

onMounted(() => {
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value);
    containerWidth.value = containerRef.value.clientWidth;
  }
  loadConfig();
});

onUnmounted(() => {
  resizeObserver.disconnect();
});

const defaultRatios = {
  title: 0.4,
  author: 0.3,
  publisher: 0.2,
  edition: 0.1
};

const columnSizes = ref({ ...defaultRatios });

const updateColumnSizes = () => {
  const w = containerWidth.value;
  columns.value[0].size = Math.max(100, w * columnSizes.value.title);
  columns.value[1].size = Math.max(80, w * columnSizes.value.author);
  columns.value[2].size = Math.max(80, w * columnSizes.value.publisher);
  columns.value[3].size = Math.max(60, w * columnSizes.value.edition);
};

const columns = ref<ColumnDef<any>[]>([
  { accessorKey: 'title', header: 'Title', size: 400 },
  { accessorKey: 'author', header: 'Author', size: 300 },
  { accessorKey: 'publisher', header: 'Publisher', size: 200 },
  { accessorKey: 'edition', header: 'Edition', size: 100 },
]);

const table = useVueTable({
  get data() { return props.books || [] },
  get columns() { return columns.value },
  getCoreRowModel: getCoreRowModel(),
  columnResizeMode: 'onChange',
});

const loadConfig = async () => {
  try {
    const confStr = await invoke('read_config');
    const conf = JSON.parse(confStr as string);
    if (conf.columnSizes) {
      columnSizes.value = { ...defaultRatios, ...conf.columnSizes };
    }
    updateColumnSizes();
  } catch (e) {}
};

const saveConfig = async () => {
  try {
    const confStr = await invoke('read_config');
    const conf = JSON.parse(confStr as string);
    conf.columnSizes = columnSizes.value;
    await invoke('save_config', { config: JSON.stringify(conf) });
  } catch (e) {}
};

let resizeTimeout: any;
watch(
  () => table.getState().columnSizing,
  (newSizing) => {
    if (Object.keys(newSizing).length === 0) return;
    
    // Convert absolute pixel sizes back to ratios
    const w = containerWidth.value;
    if (w > 0) {
      if (newSizing.title) columnSizes.value.title = newSizing.title / w;
      if (newSizing.author) columnSizes.value.author = newSizing.author / w;
      if (newSizing.publisher) columnSizes.value.publisher = newSizing.publisher / w;
      if (newSizing.edition) columnSizes.value.edition = newSizing.edition / w;
      
      // Debounce saving config
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        saveConfig();
      }, 500);
    }
  },
  { deep: true }
);
</script>