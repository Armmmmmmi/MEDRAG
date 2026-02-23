<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()

const tabs = [
  { key: 'single', path: '/single' },
  { key: 'multi', path: '/multi' },
  { key: 'patient', path: '/patient' },
  { key: 'qa', path: '/qa' },
  { key: 'admin', path: '/admin' }
]

const navigateTo = (path: string) => {
  router.push(path)
}

const toggleLanguage = () => {
  locale.value = locale.value === 'en' ? 'th' : 'en'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
    <header class="bg-blue-900 text-white shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-3">
            <svg class="h-8 w-8 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <h1 class="text-xl font-bold tracking-wider">MEDRAG<span class="text-blue-300">V2</span></h1>
          </div>
          <div class="hidden md:flex items-center space-x-4">
            <span class="text-xs bg-blue-800 px-3 py-1 rounded-full text-blue-200 uppercase tracking-wide">{{ t('common.subtitle') }}</span>
            <button @click="toggleLanguage" class="flex items-center space-x-1 bg-blue-700 hover:bg-blue-600 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>{{ locale === 'en' ? 'ไทย' : 'English' }}</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="navigateTo(tab.path)"
            :class="[
              route.path === tab.path
                ? 'border-blue-500 text-blue-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 text-sm transition-colors duration-200 relative'
            ]"
          >
            {{ t(`nav.${tab.key}`) }}
            <span v-if="route.path === tab.path" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-sm"></span>
          </button>
        </nav>
      </div>
    </div>

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px] p-6 transition-all duration-300">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f5f9; 
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1; 
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8; 
}
</style>
