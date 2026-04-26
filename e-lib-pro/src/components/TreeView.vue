<template>
  <ul class="pl-4">
    <li v-for="node in nodes" :key="node.id" class="my-1">
      <div class="flex items-center space-x-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 p-1 rounded" @contextmenu.prevent="onContextMenu(node)">
        <span v-if="node.children" class="text-xs">▶</span>
        <span>{{ node.name }}</span>
      </div>
      <TreeView v-if="node.children" :nodes="node.children" />
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{ nodes: any[] }>();
const onContextMenu = (node: any) => {
  // Context menu logic
};
</script>