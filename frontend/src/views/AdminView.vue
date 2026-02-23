<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../services/api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Settings State
const settings = ref({
  embedding_url: '',
  embedding_model: '',
  generation_url: '',
  generation_model: '',
  qdrant_url: '',
  qdrant_collection: '',
  patient_query_template: '',
  bridge_server_url: ''
})
const savingSettings = ref(false)
const settingsMsg = ref({ type: '', text: '' })

// Import/Export State
const fileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const importMsg = ref({ type: '', text: '' })
const reindexing = ref(false)
const reindexMsg = ref({ type: '', text: '' })

// Records State
const records = ref<any[]>([])
const totalRecords = ref(0)
const loadingRecords = ref(false)
const page = ref(0)
const limit = 10

const fetchSettings = async () => {
  try {
    const res = await api.get('/admin/settings')
    if (res.data.status === 'success') {
      settings.value = { ...settings.value, ...res.data.data }
    }
  } catch (e) {
    console.error('Failed to load settings', e)
  }
}

const saveSettings = async () => {
  savingSettings.value = true
  settingsMsg.value = { type: '', text: '' }
  try {
    const res = await api.post('/admin/settings', settings.value)
    if (res.data.status === 'success') {
      settingsMsg.value = { type: 'success', text: 'Settings saved successfully.' }
      setTimeout(() => settingsMsg.value = { type: '', text: '' }, 3000)
    }
  } catch (e: any) {
    settingsMsg.value = { type: 'error', text: e.response?.data?.message || 'Failed to save settings.' }
  } finally {
    savingSettings.value = false
  }
}

const handleFileUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0] as File
  if (!file) return
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    importMsg.value = { type: 'error', text: 'Please select a CSV file.' }
    return
  }

  importing.value = true
  importMsg.value = { type: 'info', text: 'Uploading and processing CSV (this may take a while as embeddings are generated)...' }
  
  const formData = new FormData()
  formData.append('file', file)

  try {
    // Increase timeout to 30 minutes for large files
    const res = await api.post('/admin/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 1800000 // 30 mins
    })
    
    if (res.data.status === 'success') {
      importMsg.value = { type: 'success', text: res.data.message }
      fetchRecords() // refresh table
    } else {
      importMsg.value = { type: 'error', text: res.data.message }
    }
  } catch (e: any) {
    importMsg.value = { type: 'error', text: e.response?.data?.message || 'Failed to import CSV.' }
  } finally {
    importing.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const triggerExport = () => {
  // Use direct browser download instead of API to avoid putting massive JSON in memory
  window.open('/api/admin/export', '_blank')
}

const runReindex = async () => {
  if (!confirm('Are you sure you want to re-index all database records? This will generate embeddings for all records and update Qdrant. It may take a long time.')) return
  
  reindexing.value = true
  reindexMsg.value = { type: 'info', text: 'Re-indexing started in background. Check server console for progress.' }
  
  try {
    await api.post('/admin/reindex')
  } catch (e: any) {
    reindexMsg.value = { type: 'error', text: e.response?.data?.message || 'Failed to start reindex.' }
  } finally {
    setTimeout(() => {
      reindexing.value = false
      reindexMsg.value = { type: '', text: '' }
    }, 5000)
  }
}

const fetchRecords = async () => {
  loadingRecords.value = true
  try {
    const res = await api.get(`/admin/records?limit=${limit}&offset=${page.value * limit}`)
    if (res.data.status === 'success') {
      records.value = res.data.data.records
      totalRecords.value = res.data.data.total
    }
  } catch (e) {
    console.error('Failed to load records', e)
  } finally {
    loadingRecords.value = false
  }
}

const prevPage = () => {
  if (page.value > 0) {
    page.value--
    fetchRecords()
  }
}

const nextPage = () => {
  if ((page.value + 1) * limit < totalRecords.value) {
    page.value++
    fetchRecords()
  }
}

onMounted(() => {
  fetchSettings()
  fetchRecords()
})
</script>

<template>
  <div class="space-y-10">
    <div>
      <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
        {{ t('admin.title') }}
      </h2>
      <p class="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
        {{ t('admin.desc') }}
      </p>
    </div>

    <!-- Settings Section -->
    <section class="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
      <div class="px-4 py-6 sm:px-8 border-b border-gray-100">
        <h3 class="text-base font-semibold leading-7 text-gray-900">{{ t('admin.config_title') }}</h3>
        <p class="mt-1 text-sm leading-6 text-gray-500">{{ t('admin.config_sub') }}</p>
      </div>
      
      <form @submit.prevent="saveSettings" class="px-4 py-6 sm:p-8 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
          <!-- Ollama Settings -->
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900">{{ t('admin.embed_url') }}</label>
            <input v-model="settings.embedding_url" type="text" class="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6" />
          </div>
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900">{{ t('admin.embed_model') }}</label>
            <input v-model="settings.embedding_model" type="text" class="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6" />
          </div>
          
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900">{{ t('admin.gen_url') }}</label>
            <input v-model="settings.generation_url" type="text" class="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6" />
          </div>
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900">{{ t('admin.gen_model') }}</label>
            <input v-model="settings.generation_model" type="text" class="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6" />
          </div>

          <!-- Qdrant Settings -->
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900">{{ t('admin.qdrant_url') }}</label>
            <input v-model="settings.qdrant_url" type="text" class="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6" />
          </div>
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900">{{ t('admin.qdrant_col') }}</label>
            <input v-model="settings.qdrant_collection" type="text" class="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6" />
          </div>

          <!-- Patient Bridge Settings -->
          <div>
            <label class="block text-sm font-medium leading-6 text-gray-900">{{ t('admin.bridge') }}</label>
            <input v-model="settings.bridge_server_url" type="text" class="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium leading-6 text-gray-900">{{ t('admin.sql') }}</label>
            <textarea v-model="settings.patient_query_template" rows="2" class="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6 font-mono"></textarea>
            <p class="mt-1 text-xs text-gray-500">{{ t('admin.sql_desc') }}</p>
          </div>
        </div>

        <div class="flex items-center justify-between pt-4">
          <div class="text-sm">
            <span v-if="settingsMsg.type === 'success'" class="text-green-600 font-medium">{{ settingsMsg.text }}</span>
            <span v-if="settingsMsg.type === 'error'" class="text-red-600 font-medium">{{ settingsMsg.text }}</span>
          </div>
          <button type="submit" :disabled="savingSettings" class="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 disabled:opacity-50">
            {{ savingSettings ? t('common.screening') : t('admin.save') }}
          </button>
        </div>
      </form>
    </section>

    <!-- Data Management Section -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
      
      <!-- Import -->
      <div class="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
        <h3 class="text-base font-semibold leading-7 text-gray-900 mb-4">{{ t('admin.import_title') }}</h3>
        <p class="text-sm text-gray-600 mb-6">{{ t('admin.import_sub') }}</p>
        
        <input type="file" ref="fileInput" accept=".csv" class="hidden" @change="handleFileUpload" />
        
        <button 
          @click="fileInput?.click()" 
          :disabled="importing"
          class="w-full flex justify-center items-center rounded-md bg-blue-50 px-3 py-6 text-sm font-semibold text-blue-700 shadow-sm border-2 border-dashed border-blue-200 hover:border-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
        >
          <svg v-if="importing" class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="h-6 w-6 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {{ importing ? t('common.screening') : t('admin.import_btn') }}
        </button>

        <div v-if="importMsg.text" class="mt-4 text-sm" :class="importMsg.type === 'error' ? 'text-red-600' : (importMsg.type==='success' ? 'text-green-600' : 'text-blue-600')">
          {{ importMsg.text }}
        </div>
      </div>

      <!-- Export & Reindex -->
      <div class="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6 flex flex-col justify-between space-y-4">
        <div>
          <h3 class="text-base font-semibold leading-7 text-gray-900 mb-2">{{ t('admin.export_title') }}</h3>
          <p class="text-sm text-gray-600 mb-4">{{ t('admin.export_sub') }}</p>
          <button @click="triggerExport" class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            {{ t('admin.export_btn') }}
          </button>
        </div>

        <div class="border-t border-gray-200 mt-4 pt-4">
          <h3 class="text-base font-semibold leading-7 text-gray-900 mb-2">{{ t('admin.reindex_title') }}</h3>
          <p class="text-sm text-gray-600 mb-4">{{ t('admin.reindex_sub') }}</p>
          <button @click="runReindex" :disabled="reindexing" class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 disabled:opacity-50">
            {{ t('admin.reindex_btn') }}
          </button>
          <div v-if="reindexMsg.text" class="mt-2 text-sm" :class="reindexMsg.type === 'error' ? 'text-red-600' : 'text-blue-600'">
            {{ reindexMsg.text }}
          </div>
        </div>
      </div>

    </section>

    <!-- Database Table Section -->
    <section class="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
      <div class="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
        <h3 class="text-base font-semibold leading-6 text-gray-900">{{ t('admin.db_title') }} ({{ totalRecords }})</h3>
        <button @click="fetchRecords" class="text-sm font-medium text-blue-600 hover:text-blue-500">{{ t('admin.refresh') }}</button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">{{ t('admin.drugA') }}</th>
              <th scope="col" class="whitespace-nowrap py-3.5 px-3 text-left text-sm font-semibold text-gray-900">{{ t('admin.drugB') }}</th>
              <th scope="col" class="whitespace-nowrap py-3.5 px-3 text-left text-sm font-semibold text-gray-900">{{ t('admin.severity') }}</th>
              <th scope="col" class="whitespace-nowrap py-3.5 px-3 text-left text-sm font-semibold text-gray-900">{{ t('admin.date') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-if="loadingRecords">
              <td colspan="4" class="py-10 text-center text-sm text-gray-500 italic">Loading records...</td>
            </tr>
            <tr v-else-if="records.length === 0">
              <td colspan="4" class="py-10 text-center text-sm text-gray-500 italic">No records found. Import a CSV to get started.</td>
            </tr>
            <tr v-else v-for="record in records" :key="record.id" class="hover:bg-gray-50">
              <td class="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{{ record.drugA }}</td>
              <td class="whitespace-nowrap py-3 px-3 text-sm text-gray-500">{{ record.drugB }}</td>
              <td class="whitespace-nowrap py-3 px-3 text-sm text-gray-500">{{ record.severity }}</td>
              <td class="whitespace-nowrap py-3 px-3 text-sm text-gray-500">{{ new Date(record.created_at).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Showing <span class="font-medium">{{ Math.min(totalRecords, page * limit + 1) }}</span> to 
              <span class="font-medium">{{ Math.min(totalRecords, (page + 1) * limit) }}</span> of 
              <span class="font-medium">{{ totalRecords }}</span> results
            </p>
          </div>
          <div>
            <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button @click="prevPage" :disabled="page === 0" class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                <span class="sr-only">Previous</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                </svg>
              </button>
              <button @click="nextPage" :disabled="(page + 1) * limit >= totalRecords" class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                <span class="sr-only">Next</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>
