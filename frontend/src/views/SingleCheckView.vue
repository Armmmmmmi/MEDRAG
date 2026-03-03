<script setup lang="ts">
import { ref } from 'vue'
import api from '../services/api'
import { useI18n } from 'vue-i18n'
import DrugAutocomplete from '../components/DrugAutocomplete.vue'

const { t } = useI18n()
const drugA = ref('')
const drugB = ref('')
const loading = ref(false)
const error = ref('')

const result = ref<{
  rawResponse: string,
  retrievedContext: string,
  similarityScore: number
} | null>(null)

const checkInteraction = async () => {
  if (!drugA.value.trim() || !drugB.value.trim()) {
    error.value = 'Please enter both drug names.'
    return
  }

  loading.value = true
  error.value = ''
  result.value = null

  try {
    const response = await api.post('/interaction/single', {
      drugA: drugA.value,
      drugB: drugB.value
    })

    if (response.data.status === 'success') {
      result.value = response.data.data
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
  drugA.value = ''
  drugB.value = ''
  result.value = null
  error.value = ''
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h2 class="text-2xl font-bold leading-normal text-gray-900 sm:text-3xl sm:tracking-tight">
        {{ t('single.title') }}
      </h2>
      <p class="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
        {{ t('single.desc') }}
      </p>
    </div>

    <div class="bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm">
      <form @submit.prevent="checkInteraction" class="space-y-6">
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label for="drugA" class="block text-sm font-medium leading-6 text-gray-900">{{ t('single.drugA') }}</label>
            <div class="mt-2">
              <DrugAutocomplete
                v-model="drugA"
                id="drugA"
                :placeholder="t('single.drugA_placeholder')"
                :disabled="loading"
              />
            </div>
          </div>
          <div>
            <label for="drugB" class="block text-sm font-medium leading-6 text-gray-900">{{ t('single.drugB') }}</label>
            <div class="mt-2">
              <DrugAutocomplete
                v-model="drugB"
                id="drugB"
                :placeholder="t('single.drugB_placeholder')"
                :disabled="loading"
              />
            </div>
          </div>
        </div>

        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
            class="inline-flex justify-center rounded-md bg-teal-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? t('common.screening') : t('single.check') }}
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

    <!-- Results Section -->
    <div v-if="result" class="animate-fade-in border-t border-gray-200 pt-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <!-- LLM Response -->
        <div class="bg-white rounded-xl border border-teal-100 shadow-sm overflow-hidden">
          <div class="bg-teal-50 px-6 py-4 border-b border-teal-100 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-teal-900 flex items-center">
              <svg class="h-5 w-5 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ t('single.report') }}
            </h3>
            <span class="inline-flex items-center rounded-md bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
              AI Generated
            </span>
          </div>
          <div class="p-6">
            <div class="prose prose-blue max-w-none text-gray-700 whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {{ result.rawResponse }}
            </div>
          </div>
        </div>

        <!-- Retrieved Context -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center">
              <svg class="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {{ t('single.context') }}
            </h3>
            
            <span 
              class="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold"
              :class="{
                'bg-green-100 text-green-800': result.similarityScore >= 0.8,
                'bg-yellow-100 text-yellow-800': result.similarityScore >= 0.65 && result.similarityScore < 0.8,
                'bg-red-100 text-red-800': result.similarityScore < 0.65
              }"
              title="Similarity Score"
            >
              {{ t('single.score') }} {{ result.similarityScore > 0 ? result.similarityScore.toFixed(3) : t('common.none') }}
            </span>
          </div>
          <div class="p-6 flex-1 bg-gray-50/50">
            <div v-if="result.retrievedContext" class="font-mono text-xs text-gray-600 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {{ result.retrievedContext }}
            </div>
            <div v-else class="text-sm text-gray-500 italic text-center py-8">
              {{ t('single.no_context') }}
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- AI Disclaimer -->
    <div class="mt-8 text-center text-xs text-gray-400">
      <p>{{ t('common.ai_disclaimer') }}</p>
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
