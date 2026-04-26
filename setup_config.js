const fs = require('fs');

const content = fs.readFileSync('/workspace/e-lib-pro/src/App.vue', 'utf-8');

const newModals = `
    <!-- Modals -->
    <div v-if="showConfig" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-96">
        <h2 class="text-xl mb-4">Configuration</h2>
        <div class="space-y-3">
          <label class="flex items-center space-x-2">
            <input type="checkbox" v-model="config.darkMode" @change="applyConfig" />
            <span>Dark Mode</span>
          </label>
          <label class="flex flex-col space-y-1">
            <span>Primary Color</span>
            <input type="color" v-model="config.primaryColor" @change="applyConfig" class="w-full h-8 cursor-pointer" />
          </label>
        </div>
        <div class="flex justify-end space-x-2 mt-6">
          <button @click="showConfig = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Close</button>
          <button @click="saveConfig" class="px-4 py-2 rounded bg-blue-500 text-white">Save</button>
        </div>
      </div>
    </div>
`;

const configScript = `
const showConfig = ref(false);
const config = ref({ darkMode: false, primaryColor: '#3b82f6' });

onMounted(async () => {
  store.loadDatabases();
  try {
    const confStr = await invoke('read_config');
    const conf = JSON.parse(confStr as string);
    if (conf.darkMode !== undefined) config.value.darkMode = conf.darkMode;
    if (conf.primaryColor !== undefined) config.value.primaryColor = conf.primaryColor;
    applyConfig();
  } catch (e) {}
});

const applyConfig = () => {
  if (config.value.darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  document.documentElement.style.setProperty('--color-primary', config.value.primaryColor);
};

const saveConfig = async () => {
  await invoke('save_config', { config: JSON.stringify(config.value) });
  showConfig.value = false;
};
`;

let replaced = content.replace(/<!-- Modals -->/, newModals + '\n    <!-- Modals -->');
replaced = replaced.replace(/<div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="toggleTheme">Toggle Theme<\/div>/, '<div class="px-4 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" @click="showConfig = true">GUI Config Editor</div>');

// Remove toggleTheme function
replaced = replaced.replace(/const toggleTheme = \(\) => {[\s\S]*?};/, configScript);
// Remove onMounted block and replace it
replaced = replaced.replace(/onMounted\(\(\) => {[\s\S]*?}\);/, '');

fs.writeFileSync('/workspace/e-lib-pro/src/App.vue', replaced);
