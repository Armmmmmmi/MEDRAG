<script setup lang="ts">
import { ref, watch } from 'vue'
import api from '../services/api'
import { useDebounceFn, onClickOutside } from '@vueuse/core'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  disabled?: boolean
  id?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', value: string): void
}>()

const localValue = ref(props.modelValue)
const suggestions = ref<string[]>([])
const loading = ref(false)
const showDropdown = ref(false)
const dropdownRef = ref<HTMLDivElement | null>(null)

// Sync from props
watch(() => props.modelValue, (newVal) => {
  if (newVal !== localValue.value) {
    localValue.value = newVal
  }
})

const fetchSuggestions = async (query: string) => {
  loading.value = true
  try {
    const res = await api.get('/drugs/suggest', { params: { q: query } })
    if (res.data.status === 'success') {
      suggestions.value = res.data.data
      showDropdown.value = suggestions.value.length > 0
    }
  } catch (err) {
    console.error('Failed to fetch suggestions', err)
  } finally {
    loading.value = false
  }
}

// Debounce to avoid spamming the API
const debouncedFetch = useDebounceFn((query: string) => fetchSuggestions(query), 300)

// Sync to props and fetch suggestions
watch(localValue, (newVal) => {
  emit('update:modelValue', newVal)
  if (newVal.trim().length >= 2) {
    debouncedFetch(newVal)
  } else {
    suggestions.value = []
    showDropdown.value = false
  }
})

const selectSuggestion = (suggestion: string) => {
  localValue.value = suggestion
  showDropdown.value = false
  emit('select', suggestion)
}

// Close dropdown when clicking outside
onClickOutside(dropdownRef, () => {
  showDropdown.value = false
})
</script>

<template>
  <div class="relative w-full" ref="dropdownRef">
    <input
      :id="id"
      type="text"
      v-model="localValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @focus="() => { if (suggestions.length > 0) showDropdown = true }"
      class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6"
    />
    
    <!-- Dropdown -->
    <div 
      v-if="showDropdown && !disabled" 
      class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
    >
      <div v-if="loading" class="px-4 py-2 text-sm text-gray-500 flex items-center">
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading...
      </div>
      <ul v-else>
        <li 
          v-for="(suggestion, index) in suggestions" 
          :key="index"
          @click="selectSuggestion(suggestion)"
          class="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-teal-600 hover:text-white transition-colors"
        >
          <span class="block truncate font-medium">{{ suggestion }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
