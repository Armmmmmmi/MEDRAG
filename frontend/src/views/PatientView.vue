<script setup lang="ts">
import { ref, computed } from 'vue'
import api from '../services/api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const hn = ref('')
const date = ref('')

const fetching = ref(false)
const checking = ref(false)
const fetchError = ref('')
const checkError = ref('')

const fetchedDrugs = ref<{ name: string, selected: boolean }[]>([])

const result = ref<{
  normalizedDrugs: string[],
  results: Array<{
    pair: [string, string],
    rawResponse: string,
    retrievedContext: string,
    similarityScore: number
  }>
} | null>(null)

const selectedDrugsCount = computed(() => fetchedDrugs.value.filter(d => d.selected).length)

const fetchPatientData = async () => {
  if (!hn.value.trim() || !date.value.trim()) {
    fetchError.value = 'Please enter both HN and Date.'
    return
  }

  fetching.value = true
  fetchError.value = ''
  fetchedDrugs.value = []
  result.value = null
  checkError.value = ''

  try {
    const response = await api.post('/patient/fetch', {
      hn: hn.value,
      date: date.value
    })

    if (response.data.status === 'success') {
      const drugs = response.data.data.drugs || []
      if (drugs.length === 0) {
        fetchError.value = 'No medications found for this patient on the specific date.'
      } else {
        fetchedDrugs.value = drugs.map((d: string) => ({ name: d, selected: true }))
      }
    } else {
      fetchError.value = response.data.message || 'Unknown error occurred'
    }
  } catch (err: any) {
    console.error(err)
    if (err.response?.data?.message) {
      fetchError.value = err.response.data.message
    } else {
      fetchError.value = err.message || 'Failed to connect to server'
    }
  } finally {
    fetching.value = false
  }
}

const checkInteractions = async () => {
  const selectedList = fetchedDrugs.value.filter(d => d.selected).map(d => d.name)
  
  if (selectedList.length < 2) {
    checkError.value = 'Select at least two medications to check for interactions.'
    return
  }

  checking.value = true
  checkError.value = ''
  result.value = null

  try {
    const response = await api.post('/interaction/multi', {
      text: selectedList.join(', ')
    })

    if (response.data.status === 'success') {
      result.value = response.data.data
      
      if (result.value && result.value.normalizedDrugs.length < 2) {
        checkError.value = 'Could not detect at least two medications to compare.'
      }
    } else {
      checkError.value = response.data.message || 'Unknown error occurred'
    }
  } catch (err: any) {
    console.error(err)
    if (err.response?.data?.message) {
      checkError.value = err.response.data.message
    } else {
      checkError.value = err.message || 'Failed to connect to server'
    }
  } finally {
    checking.value = false
  }
}

const toggleAll = (checked: boolean) => {
  fetchedDrugs.value.forEach(d => d.selected = checked)
}

const clear = () => {
  hn.value = ''
  date.value = ''
  fetchedDrugs.value = []
  result.value = null
  fetchError.value = ''
  checkError.value = ''
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
        {{ t('patient.title') }}
      </h2>
      <p class="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
        {{ t('patient.desc') }}
      </p>
    </div>

    <div class="bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm">
      <form @submit.prevent="fetchPatientData" class="space-y-6">
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label for="hn" class="block text-sm font-medium leading-6 text-gray-900">{{ t('patient.hn') }}</label>
            <div class="mt-2">
              <input
                v-model="hn"
                type="text"
                name="hn"
                id="hn"
                class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                :placeholder="t('patient.hn_placeholder')"
                :disabled="fetching || checking"
              />
            </div>
          </div>
          <div>
            <label for="date" class="block text-sm font-medium leading-6 text-gray-900">{{ t('patient.date') }}</label>
            <div class="mt-2">
              <input
                v-model="date"
                type="date"
                name="date"
                id="date"
                class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                :disabled="fetching || checking"
              />
            </div>
          </div>
        </div>

        <div v-if="fetchError" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">{{ fetchError }}</h3>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <button
            type="submit"
            :disabled="fetching || checking"
            class="inline-flex justify-center rounded-md bg-white border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg v-if="fetching" class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ fetching ? t('patient.fetching') : t('patient.fetch') }}
          </button>
          
          <button
            type="button"
            @click="clear"
            :disabled="fetching || checking"
            class="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ t('patient.clear') }}
          </button>
        </div>
      </form>
    </div>

    <!-- Drug Selection List -->
    <div v-if="fetchedDrugs.length > 0" class="animate-fade-in bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 class="text-lg font-medium text-gray-900">{{ t('patient.found') }} ({{ fetchedDrugs.length }})</h3>
          <p class="text-sm text-gray-500">{{ t('patient.found_sub') }}</p>
        </div>
        <div class="flex space-x-3">
          <button @click="toggleAll(true)" class="text-sm font-medium text-blue-600 hover:text-blue-500">{{ t('patient.selectAll') }}</button>
          <span class="text-gray-300">|</span>
          <button @click="toggleAll(false)" class="text-sm font-medium text-gray-600 hover:text-gray-500">{{ t('patient.deselectAll') }}</button>
        </div>
      </div>
      
      <div class="p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="(drug, index) in fetchedDrugs" :key="index" class="relative flex items-start">
            <div class="flex h-6 items-center">
              <input
                :id="`drug-${index}`"
                v-model="drug.selected"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
            </div>
            <div class="ml-3 text-sm leading-6">
              <label :for="`drug-${index}`" class="font-medium text-gray-900 select-none cursor-pointer">{{ drug.name }}</label>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
        <div class="text-sm text-gray-700">
          <span class="font-bold">{{ selectedDrugsCount }}</span> {{ t('patient.selectedInfo') }}
        </div>
        
        <button
          @click="checkInteractions"
          :disabled="selectedDrugsCount < 2 || checking"
          class="inline-flex justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg v-if="checking" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ checking ? t('common.screening') : t('patient.runScreen') }}
        </button>
      </div>

      <!-- Check Error -->
      <div v-if="checkError" class="bg-red-50 p-4 border-t border-red-100">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">{{ checkError }}</h3>
          </div>
        </div>
      </div>
    </div>


    <!-- Results Section (Same visual style as Multi Check) -->
    <div v-if="result && result.results.length > 0" class="animate-fade-in space-y-8 border-t border-gray-200 pt-8">
      <h3 class="text-xl font-bold text-gray-900">{{ t('multi.results_title') }}</h3>
      
      <div v-for="(item, index) in result.results" :key="index" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        <!-- Pair Header -->
        <div class="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-800 font-bold text-sm">
              {{ index + 1 }}
            </span>
            <span class="text-lg font-bold text-gray-900 capitalize">{{ item.pair[0] }}</span>
            <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span class="text-lg font-bold text-gray-900 capitalize">{{ item.pair[1] }}</span>
          </div>

          <div class="flex items-center space-x-2">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t('single.score') }}</span>
            <span 
              class="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold"
              :class="{
                'bg-green-100 text-green-800': item.similarityScore >= 0.8,
                'bg-yellow-100 text-yellow-800': item.similarityScore >= 0.70 && item.similarityScore < 0.8,
                'bg-red-100 text-red-800': item.similarityScore < 0.70 && item.similarityScore > 0,
                'bg-gray-100 text-gray-600': item.similarityScore === 0
              }"
            >
              {{ item.similarityScore > 0 ? item.similarityScore.toFixed(3) : t('common.none') }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-gray-200">
          
          <!-- LLM Response -->
          <div class="p-6">
            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
              <svg class="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {{ t('single.report') }}
            </h4>
            <div class="prose prose-sm prose-blue max-w-none text-gray-700 whitespace-pre-wrap font-sans leading-relaxed"
                 :class="{'text-gray-400 italic font-medium': item.similarityScore === 0}">
              {{ item.rawResponse }}
            </div>
          </div>

          <!-- Retrieved Context -->
          <div class="p-6 bg-gray-50/30">
            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
              <svg class="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {{ t('single.context') }}
            </h4>
            <div v-if="item.retrievedContext" class="font-mono text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
              {{ item.retrievedContext }}
            </div>
            <div v-else class="text-sm text-gray-400 italic">
              {{ t('single.no_context') }}
            </div>
          </div>
          
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
