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