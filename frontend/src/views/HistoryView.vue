<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import api from '../services/api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface HistoryRecord {
  id: number;
  query_type: string;
  query_input: any;
  query_result: any;
  similarity_score: number;
  created_at: string;
}

const records = ref<HistoryRecord[]>([])
const loading = ref(true)
const total = ref(0)
const page = ref(0)
const limit = ref(10)
const expandedId = ref<number | null>(null)

// Filters
const searchForm = ref({
  search: '',
  type: 'all',
  startDate: '',
  endDate: ''
})

const fetchHistory = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      limit: limit.value
    }
    
    if (searchForm.value.search) params.search = searchForm.value.search
    if (searchForm.value.type !== 'all') params.type = searchForm.value.type
    if (searchForm.value.startDate) params.startDate = searchForm.value.startDate
    if (searchForm.value.endDate) params.endDate = searchForm.value.endDate

    const res = await api.get('/history', { params })
    if (res.data.status === 'success') {
      records.value = res.data.data.records
      total.value = res.data.data.total
      page.value = res.data.data.page
    }
  } catch (err: any) {
    console.error('Failed to fetch history:', err)
  } finally {
    loading.value = false
  }
}

const formatQueryInput = (type: string, input: any) => {
  if (type === 'single' || type === 'multi') {
    return `${input.drugA || ''} ${input.drugB ? ', ' + input.drugB : ''}`
  } else if (type === 'qa') {
    return input.question || ''
  }
  return JSON.stringify(input)
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('th-TH', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  }).format(date)
}

const toggleExpand = (id: number) => {
  expandedId.value = expandedId.value === id ? null : id
}

const changePage = (newPage: number) => {
  if (newPage < 0 || newPage * limit.value >= total.value) return
  page.value = newPage
  fetchHistory()
}

// Watch filters - reset page and fetch
watch(() => searchForm.value, () => {
  page.value = 0
  fetchHistory()
}, { deep: true })

onMounted(() => {
  fetchHistory()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold leading-normal text-gray-900 sm:text-3xl sm:tracking-tight">
        {{ t('history.title') }}
      </h2>
      <p class="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
        {{ t('history.desc') }}
      </p>
    </div>

    <!-- Filters Map -->
    <div class="bg-gray-50 p-4 border border-gray-200 rounded-lg flex flex-col md:flex-row gap-4 items-end">
      <div class="flex-1 w-full relative">
        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('history.search') }}</label>
        <div class="absolute inset-y-0 left-0 pl-3 top-6 flex items-center pointer-events-none">
          <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input 
          v-model="searchForm.search" 
          type="text" 
          :placeholder="t('history.search_placeholder')"
          class="pl-9 block w-full rounded-md border-gray-300 py-2 text-gray-900 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
        />
      </div>

      <div class="w-full md:w-48">
        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('history.type') }}</label>
        <select v-model="searchForm.type" class="block w-full rounded-md border-gray-300 py-2 text-gray-900 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm">
          <option value="all">{{ t('history.type_all') }}</option>
          <option value="single">{{ t('history.type_single') }}</option>
          <option value="multi">{{ t('history.type_multi') }}</option>
          <option value="qa">{{ t('history.type_qa') }}</option>
        </select>
      </div>

      <div class="w-full md:w-40">
        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('history.start_date') }}</label>
        <input v-model="searchForm.startDate" type="date" class="block w-full rounded-md border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm" />
      </div>

      <div class="w-full md:w-40">
        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('history.end_date') }}</label>
        <input v-model="searchForm.endDate" type="date" class="block w-full rounded-md border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm" />
      </div>
      
      <button @click="fetchHistory" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
        {{ t('history.refresh') }}
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white shadow-sm ring-1 ring-gray-300 sm:rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-300">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 w-24">{{ t('history.col_type') }}</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{{ t('history.col_query') }}</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-32">{{ t('history.col_score') }}</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-48">{{ t('history.col_time') }}</th>
            <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6 w-16">
              <span class="sr-only">Detail</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <template v-for="record in records" :key="record.id">
            <tr :class="[expandedId === record.id ? 'bg-teal-50' : 'hover:bg-gray-50', 'transition-colors cursor-pointer']" @click="toggleExpand(record.id)">
              <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                <span :class="[
                  record.query_type === 'single' ? 'bg-blue-100 text-blue-800' : 
                  record.query_type === 'multi' ? 'bg-indigo-100 text-indigo-800' :
                  record.query_type === 'qa' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800',
                  'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10 uppercase'
                ]">
                  {{ record.query_type }}
                </span>
              </td>
              <td class="px-3 py-4 text-sm text-gray-900 truncate max-w-xs md:max-w-md">
                {{ formatQueryInput(record.query_type, record.query_input) }}
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <span class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  {{ (record.similarity_score * 100).toFixed(1) }}%
                </span>
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {{ formatDate(record.created_at) }}
              </td>
              <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button type="button" class="text-teal-600 hover:text-teal-900 focus:outline-none p-1 rounded-full hover:bg-teal-100 transition-colors">
                  <svg :class="[expandedId === record.id ? 'rotate-180' : '', 'h-5 w-5 transform transition-transform']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </td>
            </tr>
            <!-- Expanded Detail Row -->
            <tr v-if="expandedId === record.id" class="bg-gray-50 border-t-0">
              <td colspan="5" class="px-4 py-5 sm:px-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="bg-white p-4 rounded-md border border-gray-200">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ t('history.col_detail_query') }}</h4>
                    <pre class="bg-gray-100 p-2 rounded text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap">{{ JSON.stringify(record.query_input, null, 2) }}</pre>
                  </div>
                  <div class="bg-white p-4 rounded-md border border-gray-200">
                    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{{ t('history.col_detail_result') }}</h4>
                    <pre v-if="record.query_type === 'qa'" class="bg-gray-100 p-2 rounded text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap">{{ record.query_result.answer }}</pre>
                    <pre v-else class="bg-gray-100 p-2 rounded text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap">{{ record.query_result.rawResponse }}</pre>
                  </div>
                </div>
              </td>
            </tr>
          </template>
          <tr v-if="records.length === 0">
            <td colspan="5" class="px-6 py-12 text-center text-sm text-gray-500">
              {{ t('history.empty') }}
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination Controls -->
      <div v-if="total > limit" class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div class="flex flex-1 justify-between sm:hidden">
          <button @click="changePage(page - 1)" :disabled="page === 0" class="disabled:opacity-50 relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Previous</button>
          <button @click="changePage(page + 1)" :disabled="(page + 1) * limit >= total" class="disabled:opacity-50 relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Next</button>
        </div>
        <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Showing
              <span class="font-medium">{{ page * limit + 1 }}</span>
              to
              <span class="font-medium">{{ Math.min((page + 1) * limit, total) }}</span>
              of
              <span class="font-medium">{{ total }}</span>
              results
            </p>
          </div>
          <div>
            <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button 
                @click="changePage(page - 1)" 
                :disabled="page === 0"
                class="disabled:opacity-50 relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span class="sr-only">Previous</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                </svg>
              </button>
              
              <button 
                @click="changePage(page + 1)" 
                :disabled="(page + 1) * limit >= total"
                class="disabled:opacity-50 relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span class="sr-only">Next</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
