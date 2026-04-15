<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <main class="max-w-6xl mx-auto px-4 py-8">
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Quotes</h1>
          <p class="text-gray-500 text-sm mt-1">
            Welcome back, {{ auth.user?.name }}
          </p>
        </div>
        <router-link to="/quotes/new" class="btn-primary gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Quote
        </router-link>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div class="card p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Total Quotes</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ quotes.length }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Drafts</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ countByStatus('draft') }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Sent</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ countByStatus('sent') }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Accepted</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ countByStatus('accepted') }}</p>
        </div>
      </div>

      <!-- Quotes table -->
      <div class="card overflow-hidden">
        <!-- Toolbar -->
        <div class="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <input
            v-model="search"
            type="search"
            placeholder="Search by customer or quote number…"
            class="form-input max-w-sm"
          />
          <select v-model="filterStatus" class="form-select w-auto">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="py-16 text-center text-gray-400">
          <svg class="animate-spin h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p class="mt-2 text-sm">Loading quotes…</p>
        </div>

        <!-- Empty -->
        <div v-else-if="!filtered.length" class="py-16 text-center text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-sm font-medium">No quotes found</p>
          <p class="text-xs mt-1">
            <router-link to="/quotes/new" class="text-brand-600 hover:underline">Create your first quote</router-link>
          </p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Quote #</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Type</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Date</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Engineer</th>
                <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="q in filtered"
                :key="q.id"
                class="hover:bg-brand-50 transition-colors cursor-pointer"
                @click="router.push(`/quotes/${q.id}`)"
              >
                <td class="px-4 py-3 font-mono text-xs font-medium text-brand-700">{{ q.quote_number }}</td>
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900 truncate max-w-[160px]">{{ q.customer_name }}</p>
                  <p class="text-xs text-gray-400 truncate max-w-[160px]">{{ q.customer_address }}</p>
                </td>
                <td class="px-4 py-3 hidden sm:table-cell text-gray-600">{{ installLabel(q.installation_type) }}</td>
                <td class="px-4 py-3 hidden md:table-cell text-gray-500">{{ formatDate(q.date) }}</td>
                <td class="px-4 py-3 hidden md:table-cell text-gray-500">{{ q.engineer_name || '—' }}</td>
                <td class="px-4 py-3">
                  <span :class="statusClass(q.status)" class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                    {{ q.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right font-medium text-gray-900">{{ fmtCurrency(q.total) }}</td>
                <td class="px-4 py-3 text-right" @click.stop>
                  <button
                    class="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Delete quote"
                    @click="deleteQuote(q)"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppHeader from '../components/AppHeader.vue'
import api from '../api'

const router      = useRouter()
const auth        = useAuthStore()
const quotes      = ref([])
const loading     = ref(true)
const search      = ref('')
const filterStatus = ref('')

const INSTALL_LABELS = {
  single_split: 'Single Split',
  multi_split:  'Multi-Split',
  cassette:     'Cassette',
  vrf_vrv:      'VRF/VRV',
}

function installLabel(t) { return INSTALL_LABELS[t] || t }

function formatDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB')
}

function fmtCurrency(n) {
  return `£${parseFloat(n || 0).toFixed(2)}`
}

function statusClass(s) {
  return {
    draft:    'bg-gray-100 text-gray-600',
    sent:     'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
  }[s] || 'bg-gray-100 text-gray-600'
}

function countByStatus(s) {
  return quotes.value.filter(q => q.status === s).length
}

const filtered = computed(() => {
  let list = quotes.value
  if (filterStatus.value) list = list.filter(q => q.status === filterStatus.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(r =>
      r.customer_name?.toLowerCase().includes(q) ||
      r.quote_number?.toLowerCase().includes(q),
    )
  }
  return list
})

async function loadQuotes() {
  try {
    const { data } = await api.get('/quotes')
    quotes.value = data
  } finally {
    loading.value = false
  }
}

async function deleteQuote(q) {
  if (!confirm(`Delete quote ${q.quote_number} for ${q.customer_name}?\nThis cannot be undone.`)) return
  await api.delete(`/quotes/${q.id}`)
  quotes.value = quotes.value.filter(r => r.id !== q.id)
}

onMounted(loadQuotes)
</script>
