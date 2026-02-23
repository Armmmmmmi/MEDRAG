<script setup lang="ts">
import { ref } from 'vue'
import api from '../services/api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const inputText = ref('')
const loading = ref(false)
const error = ref('')

const result = ref<{
  normalizedDrugs: string[],
  results: Array<{
    pair: [string, string],
    rawResponse: string,
    retrievedContext: string,
    similarityScore: number
  }>
} | null>(null)

const checkInteractions = async () => {
  if (!inputText.value.trim()) {
    error.value = 'Please enter a list of medications.'
    return
  }

  loading.value = true
  error.value = ''
  result.value = null

  try {
    const response = await api.post('/interaction/multi', {
      text: inputText.value
    })

    if (response.data.status === 'success') {
      result.value = response.data.data
      
      if (result.value && result.value.normalizedDrugs.length < 2) {
        error.value = 'Could not detect at least two medications to compare.'
      }
    } else {
      error.value = response.data.message || 'Unknown error occurred'
    }
  } catch (err: any) {
    console.error(err)
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else {
      error.value = err.message || 'Failed to connect to server'
    }
  } finally {
    loading.value = false
  }
}

const clear = () => {
  inputText.value = ''
  result.value = null
  error.value = ''
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
        {{ t('multi.title') }}
      </h2>
      <p class="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
        {{ t('multi.desc') }}
      </p>
    </div>

    <!-- Input Section -->
    <div class="bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm">
      <form @submit.prevent="checkInteractions" class="space-y-6">
        <div>
          <label for="medications" class="block text-sm font-medium leading-6 text-gray-900">{{ t('multi.input_label') }}</label>
          <div class="mt-2">
            <textarea
              v-model="inputText"
              id="medications"
              name="medications"
              rows="4"
              class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              :placeholder="t('multi.input_placeholder')"
              :disabled="loading"
            ></textarea>
          </div>
          <p class="mt-2 text-sm text-gray-500" v-if="loading">{{ t('multi.wait') }}</p>
        </div>

        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">{{ error }}</h3>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <button
            type="submit"
            :disabled="loading"
            class="inline-flex justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? t('common.screening') : t('multi.screenBtn') }}
          </button>
          
          <button
            type="button"
            @click="clear"
            :disabled="loading"
            class="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ t('common.clear') }}
          </button>
        </div>
      </form>
    </div>

    <!-- Extracted Drugs Info -->
    <div v-if="result && result.normalizedDrugs.length > 0" class="animate-fade-in pb-4">
      <h3 class="text-sm font-medium text-gray-700 mb-2">{{ t('multi.detected') }} ({{ result.normalizedDrugs.length }}):</h3>
      <div class="flex flex-wrap gap-2">
        <span 
          v-for="drug in result.normalizedDrugs" 
          :key="drug"
          class="inline-flex items-center rounded-md bg-white px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 shadow-sm"
        >
          {{ drug }}
        </span>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="result && result.results.length > 0" class="animate-fade-in space-y-8 border-t border-gray-200 pt-8">
      
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
