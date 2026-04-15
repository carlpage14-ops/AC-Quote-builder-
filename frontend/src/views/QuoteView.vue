<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <main class="max-w-6xl mx-auto px-4 py-6">
      <!-- Page header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <router-link to="/" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </router-link>
          <div>
            <h1 class="text-xl font-bold text-gray-900">
              {{ isNew ? 'New Quote' : `Quote ${form.quote_number}` }}
            </h1>
            <p class="text-xs text-gray-400">{{ isNew ? 'Fill in the details below' : `Last saved ${lastSaved}` }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <select
            v-if="!isNew"
            v-model="form.status"
            class="form-select text-sm py-1.5 w-32"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
          <button class="btn-secondary" :disabled="saving" @click="saveQuote">
            <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
          <button v-if="!isNew" class="btn-primary" :disabled="pdfLoading" @click="downloadPdf">
            <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ pdfLoading ? 'Generating…' : 'Download PDF' }}
          </button>
        </div>
      </div>

      <!-- Error / success banners -->
      <div v-if="error" class="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
        {{ error }}
      </div>
      <div v-if="successMsg" class="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
        {{ successMsg }}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left / main column -->
        <div class="lg:col-span-2 space-y-6">

          <!-- 1. Customer Details -->
          <div class="card p-5">
            <h2 class="section-title">Customer Details</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="form-label">Customer name *</label>
                <input v-model="form.customer_name" type="text" class="form-input" placeholder="Acme Ltd / Mr J Smith" required />
              </div>
              <div class="sm:col-span-2">
                <label class="form-label">Site / installation address *</label>
                <textarea v-model="form.customer_address" class="form-input" rows="3" placeholder="12 High Street&#10;London&#10;SW1A 1AA" />
              </div>
              <div>
                <label class="form-label">Quote number *</label>
                <input v-model="form.quote_number" type="text" class="form-input font-mono" placeholder="AC-2025-0001" required />
              </div>
              <div>
                <label class="form-label">Date *</label>
                <input v-model="form.date" type="date" class="form-input" required />
              </div>
              <div class="sm:col-span-2">
                <label class="form-label">Installation type *</label>
                <select v-model="form.installation_type" class="form-select">
                  <option value="single_split">Single Split</option>
                  <option value="multi_split">Multi-Split</option>
                  <option value="cassette">Cassette</option>
                  <option value="vrf_vrv">VRF/VRV System</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 2. BTU Calculator -->
          <BTUCalculator :rooms="form.rooms" @update="form.rooms = $event" />

          <!-- 3. Line Items -->
          <LineItems :form="form" :settings="settings" />

          <!-- 4. Notes -->
          <div class="card p-5">
            <h2 class="section-title">Notes</h2>
            <textarea
              v-model="form.notes"
              class="form-input"
              rows="4"
              placeholder="Any additional notes to include on the quote (survey findings, special conditions, access requirements, etc.)"
            />
          </div>

        </div>

        <!-- Right column: Price Summary (sticky on desktop) -->
        <div class="lg:col-span-1">
          <div class="lg:sticky lg:top-6">
            <PriceSummary :form="form" :settings="settings" @totals="onTotals" />

            <!-- Mobile PDF button -->
            <div class="mt-4 lg:hidden">
              <button v-if="!isNew" class="btn-primary w-full" :disabled="pdfLoading" @click="downloadPdf">
                {{ pdfLoading ? 'Generating…' : 'Download PDF' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import BTUCalculator from '../components/BTUCalculator.vue'
import LineItems from '../components/LineItems.vue'
import PriceSummary from '../components/PriceSummary.vue'
import api from '../api'

const route  = useRoute()
const router = useRouter()

const isNew      = computed(() => route.params.id === undefined)
const saving     = ref(false)
const pdfLoading = ref(false)
const error      = ref('')
const successMsg = ref('')
const lastSaved  = ref('never')
const settings   = ref({})

const form = reactive({
  quote_number:      '',
  customer_name:     '',
  customer_address:  '',
  date:              new Date().toISOString().slice(0, 10),
  installation_type: 'single_split',
  status:            'draft',
  notes:             '',
  rooms:             [],
  units:             [{ description: '', qty: 1, unit_price: '' }],
  pipework:          { metres: '', price_per_metre: '' },
  electrical:        { description: '', cost: '' },
  labour:            { hours: '', rate: '' },
  consumables:       { type: 'percentage', value: '' },
})

// Totals are computed inside PriceSummary and emitted up so we can persist them
const totals = ref({ subtotal: 0, total: 0 })
function onTotals(t) { totals.value = t }

// ── Load settings & quote on mount ──────────────────────────────────────────
onMounted(async () => {
  try {
    const { data: s } = await api.get('/settings')
    settings.value = s
    // Pre-fill labour rate and pipework rate from admin settings
    if (!form.labour.rate)          form.labour.rate          = s.labour_rate    || ''
    if (!form.pipework.price_per_metre) form.pipework.price_per_metre = s.pipework_rate || ''
    if (!form.consumables.value && s.consumables_value) form.consumables.value = s.consumables_value
    if (!form.consumables.type  && s.consumables_type)  form.consumables.type  = s.consumables_type
  } catch { /* ignore — non-critical */ }

  if (isNew.value) {
    const { data } = await api.get('/quotes/next-number')
    form.quote_number = data.quote_number
  } else {
    await loadQuote()
  }
})

async function loadQuote() {
  try {
    const { data } = await api.get(`/quotes/${route.params.id}`)
    Object.assign(form, {
      quote_number:      data.quote_number,
      customer_name:     data.customer_name,
      customer_address:  data.customer_address,
      date:              data.date,
      installation_type: data.installation_type,
      status:            data.status,
      notes:             data.notes || '',
      rooms:             data.rooms || [],
      units:             data.units?.length ? data.units : [{ description: '', qty: 1, unit_price: '' }],
      pipework:          data.pipework || { metres: '', price_per_metre: '' },
      electrical:        data.electrical || { description: '', cost: '' },
      labour:            data.labour     || { hours: '', rate: '' },
      consumables:       data.consumables || { type: 'percentage', value: '' },
    })
    lastSaved.value = new Date(data.updated_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  } catch {
    error.value = 'Failed to load quote.'
  }
}

// ── Save ────────────────────────────────────────────────────────────────────
async function saveQuote() {
  if (!form.customer_name.trim()) { error.value = 'Customer name is required.'; return }
  if (!form.quote_number.trim())  { error.value = 'Quote number is required.'; return }
  error.value   = ''
  saving.value  = true
  try {
    const payload = {
      ...form,
      subtotal: totals.value.subtotal,
      total:    totals.value.total,
    }
    if (isNew.value) {
      const { data } = await api.post('/quotes', payload)
      successMsg.value = `Quote ${form.quote_number} saved!`
      setTimeout(() => successMsg.value = '', 3000)
      router.replace(`/quotes/${data.id}`)
    } else {
      await api.put(`/quotes/${route.params.id}`, payload)
      lastSaved.value  = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      successMsg.value = 'Quote saved.'
      setTimeout(() => successMsg.value = '', 3000)
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to save quote.'
  } finally {
    saving.value = false
  }
}

// ── PDF download ─────────────────────────────────────────────────────────────
async function downloadPdf() {
  // Auto-save first so the PDF reflects the latest data
  await saveQuote()
  if (error.value) return
  pdfLoading.value = true
  try {
    const res = await api.get(`/pdf/${route.params.id}`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a   = document.createElement('a')
    a.href    = url
    a.download = `Quote-${form.quote_number}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    error.value = 'Failed to generate PDF.'
  } finally {
    pdfLoading.value = false
  }
}
</script>
