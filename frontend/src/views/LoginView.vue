<template>
  <div class="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <!-- Logo / Branding -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
          <svg class="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white">AC Quote Builder</h1>
        <p class="text-brand-200 text-sm mt-1">Sign in to your account</p>
      </div>

      <!-- Card -->
      <div class="card p-6">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="form-label">Email address</label>
            <input
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="form-input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label class="form-label">Password</label>
            <input
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              class="form-input"
              placeholder="••••••••"
              required
            />
          </div>

          <p v-if="error" class="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
            {{ error }}
          </p>

          <button type="submit" class="btn-primary w-full py-2.5" :disabled="loading">
            <span v-if="loading">Signing in…</span>
            <span v-else>Sign in</span>
          </button>
        </form>
      </div>

      <p class="text-center text-brand-300 text-xs mt-6">
        Contact your administrator to create an account.
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth    = useAuthStore()
const router  = useRouter()
const loading = ref(false)
const error   = ref('')
const form    = reactive({ email: '', password: '' })

async function handleLogin() {
  error.value   = ''
  loading.value = true
  try {
    await auth.login(form.email, form.password)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
