<template>
  <ul class="pl-4 border-l border-gray-300 dark:border-gray-600 ml-2 relative">
    <li v-for="node in nodes" :key="node.id" class="my-1 relative">
      <div class="absolute w-3 border-t border-gray-300 dark:border-gray-600 top-3 -left-4"></div>
      
      <div class="flex items-center space-x-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded group transition-colors"
           @click.stop="toggleNode(node)"
           @contextmenu.stop.prevent="$emit('contextmenu', { event: $event, node })">
        
        <svg v-if="node.children && node.children.length" 
             class="w-3 h-3 text-gray-500 transition-transform" 
             :class="{ 'rotate-90': node.isOpen }"
             fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span v-else class="w-3 h-3 inline-block"></span>
        
        <svg class="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span class="text-sm truncate select-none text-gray-800 dark:text-gray-200">{{ node.name }}</span>
      </div>
      
      <div v-show="node.isOpen">
        <TreeView v-if="node.children && node.children.length" 
                  :nodes="node.children" 
                  @select="$emit('select', $event)" 
                  @contextmenu="$emit('contextmenu', $event)" />
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{ nodes: any[] }>();
const emit = defineEmits(['select', 'contextmenu']);

const toggleNode = (node: any) => {
  node.isOpen = !node.isOpen;
  emit('select', node);
};
</script>