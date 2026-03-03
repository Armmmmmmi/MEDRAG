<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import api from '../services/api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const question = ref('')
const asking = ref(false)
const error = ref('')
const chatContainer = ref<HTMLElement | null>(null)

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  contexts?: Array<{ id: string, score: number, content: string }>
}

const history = ref<ChatMessage[]>([])
let messageIdCounter = 0

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

// Watch history changes to auto-scroll
watch(history, scrollToBottom, { deep: true })

const askQuestion = async () => {
  const qText = question.value.trim()
  if (!qText) return

  // Add user message
  history.value.push({
    id: messageIdCounter++,
    role: 'user',
    content: qText
  })
  
  question.value = ''
  asking.value = true
  error.value = ''

  try {
    const response = await api.post('/rag/qa', {
      question: qText,
      topK: 3
    })

    if (response.data.status === 'success') {
      history.value.push({
        id: messageIdCounter++,
        role: 'assistant',
        content: response.data.data.answer,
        contexts: response.data.data.contexts
      })
    } else {
      error.value = response.data.message || 'Unknown error occurred'
      // Optionally pop the user message or show error inline
    }
  } catch (err: any) {
    console.error(err)
    error.value = err.response?.data?.message || err.message || 'Failed to connect to server'
  } finally {
    asking.value = false
  }
}

const clearHistory = () => {
  if (confirm('Are you sure you want to clear the conversation?')) {
    history.value = []
    error.value = ''
  }
}

// Start with a greeting
onMounted(() => {
  history.value.push({
    id: messageIdCounter++,
    role: 'assistant',
    content: 'สวัสดีครับ ผมเป็นผู้ช่วยตอบคำถาม (RAG Q&A) จากฐานข้อมูลทางการแพทย์ของ MEDRAGV\nมีอะไรให้ผมช่วยไหมครับ?'
  })
})
</script>

<template>
  <div class="h-full flex flex-col space-y-6">
    <div class="flex justify-between items-center shrink-0">
      <div>
        <h2 class="text-2xl font-bold leading-normal text-gray-900 sm:text-3xl sm:tracking-tight">
          {{ t('qa.title') }}
        </h2>
        <p class="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
          {{ t('qa.desc') }}
        </p>
      </div>
      
      <button 
        @click="clearHistory" 
        class="text-sm font-semibold text-gray-500 hover:text-gray-900 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        {{ t('qa.clear') }}
      </button>
    </div>

    <!-- Chat Container -->
    <div class="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative min-h-[500px]">
      
      <!-- Messages Area -->
      <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50/50">
        
        <div v-for="msg in history" :key="msg.id" class="flex flex-col" :class="msg.role === 'user' ? 'items-end' : 'items-start'">
          
          <!-- Message Bubble -->
          <div 
            class="max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm relative group"
            :class="msg.role === 'user' 
              ? 'bg-teal-600 text-white rounded-tr-sm' 
              : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'"
          >
            <div class="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed font-sans" :class="msg.role === 'user' ? 'text-white' : 'text-gray-800'">
              {{ msg.content }}
            </div>
            
            <!-- Source Citations (Only for assistant responses that have contexts) -->
            <div v-if="msg.role === 'assistant' && msg.contexts && msg.contexts.length > 0" class="mt-4 pt-3 border-t border-gray-100">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {{ t('qa.sources') }}
              </p>
              <div class="space-y-2">
                <details v-for="(ctx, idx) in msg.contexts" :key="idx" class="group/details">
                  <summary class="text-xs text-teal-600 font-medium cursor-pointer hover:text-teal-800 select-none list-none flex items-center">
                    <svg class="w-3 h-3 mr-1 transition-transform group-open/details:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    {{ t('qa.sourceInfo') }} {{ idx + 1 }} (Score: {{ ctx.score.toFixed(3) }})
                  </summary>
                  <div class="mt-2 pl-4 text-xs font-mono text-gray-500 whitespace-pre-wrap border-l-2 border-gray-200">
                    {{ ctx.content }}
                  </div>
                </details>
              </div>
            </div>
          </div>
          
        </div>

        <!-- Loading Indicator -->
        <div v-if="asking" class="flex flex-col items-start animate-fade-in">
          <div class="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center space-x-2">
            <div class="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>

      </div>

      <!-- Error Toast -->
      <div v-if="error" class="absolute bottom-24 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg flex items-center animate-fade-in z-10">
        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ error }}
        <button @click="error = ''" class="ml-3 text-red-200 hover:text-white">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Input Area -->
      <div class="bg-white border-t border-gray-200 p-4 shrink-0">
        <form @submit.prevent="askQuestion" class="flex gap-3 max-w-4xl mx-auto">
          <input
            v-model="question"
            type="text"
            :placeholder="t('qa.placeholder')"
            class="flex-1 rounded-full border-0 py-3 px-5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6"
            :disabled="asking"
          />
          <button
            type="submit"
            :disabled="asking || !question.trim()"
            class="inline-flex items-center justify-center rounded-full bg-teal-600 p-3 text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform active:scale-95"
          >
            <svg class="w-5 h-5 -rotate-90 translate-y-[1px] -translate-x-[1px]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>

    <!-- AI Disclaimer -->
    <div class="mt-4 text-center text-xs text-gray-400 shrink-0">
      <p>{{ t('common.ai_disclaimer') }}</p>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
