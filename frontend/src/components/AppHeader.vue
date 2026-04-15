<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-20">
    <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
      <!-- Brand -->
      <div class="flex items-center gap-2">
        <svg class="w-7 h-7 text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <router-link to="/" class="font-bold text-gray-900 text-sm sm:text-base">
          AC Quote Builder
        </router-link>
      </div>

      <!-- Nav + user menu -->
      <div class="flex items-center gap-1 sm:gap-2">
        <router-link
          to="/"
          class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          active-class="bg-brand-50 text-brand-700"
        >
          Quotes
        </router-link>
        <router-link
          v-if="auth.isAdmin"
          to="/settings"
          class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          active-class="bg-brand-50 text-brand-700"
        >
          Settings
        </router-link>

        <!-- User pill -->
        <div class="ml-2 flex items-center gap-2 pl-2 border-l border-gray-200">
          <div class="hidden sm:flex flex-col items-end">
            <span class="text-xs font-medium text-gray-900 leading-none">{{ auth.user?.name }}</span>
            <span v-if="auth.isAdmin" class="text-xs text-brand-600 leading-none mt-0.5">Admin</span>
          </div>
          <button
            class="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
            title="Sign out"
            @click="logout"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth   = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push('/login')
}
</script>
