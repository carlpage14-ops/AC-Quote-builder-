<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <main class="max-w-4xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
        <button class="btn-primary" :disabled="saving" @click="save">
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
      </div>

      <div v-if="successMsg" class="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
        {{ successMsg }}
      </div>
      <div v-if="error" class="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
        {{ error }}
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 mb-6 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-colors', activeTab === tab.id ? 'bg-brand-700 text-white' : 'text-gray-600 hover:text-gray-900']"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Company Details -->
      <div v-show="activeTab === 'company'" class="card p-6 space-y-4">
        <h2 class="section-title">Company Details</h2>

        <div>
          <label class="form-label">Company name</label>
          <input v-model="s.company_name" type="text" class="form-input" placeholder="AC Solutions Ltd" />
        </div>
        <div>
          <label class="form-label">Address (appears on PDFs)</label>
          <textarea v-model="s.company_address" class="form-input" rows="3" placeholder="Unit 5, Trade Estate&#10;London, E1 1AA" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Phone</label>
            <input v-model="s.company_phone" type="tel" class="form-input" placeholder="020 1234 5678" />
          </div>
          <div>
            <label class="form-label">Email</label>
            <input v-model="s.company_email" type="email" class="form-input" placeholder="quotes@acsolutions.co.uk" />
          </div>
        </div>

        <div>
          <label class="form-label">Company logo</label>
          <div class="flex items-start gap-4">
            <img v-if="s.company_logo" :src="s.company_logo" alt="Logo preview" class="h-16 rounded border border-gray-200 object-contain bg-white p-1" />
            <div class="flex-1">
              <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" class="form-input py-1.5" @change="onLogoUpload" />
              <p class="text-xs text-gray-400 mt-1">PNG, JPG or SVG. Recommended max 400×120px. Stored as base64.</p>
              <button v-if="s.company_logo" class="text-xs text-red-500 hover:underline mt-1" @click="s.company_logo = ''">Remove logo</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing -->
      <div v-show="activeTab === 'pricing'" class="card p-6 space-y-4">
        <h2 class="section-title">Pricing Defaults</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Labour rate (£/hr)</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
              <input v-model="s.labour_rate" type="number" min="0" step="0.50" class="form-input pl-7" placeholder="45.00" />
            </div>
          </div>
          <div>
            <label class="form-label">Pipework rate (£/m)</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
              <input v-model="s.pipework_rate" type="number" min="0" step="0.50" class="form-input pl-7" placeholder="12.00" />
            </div>
          </div>
        </div>

        <div>
          <label class="form-label">Consumables default</label>
          <div class="flex items-center gap-3">
            <select v-model="s.consumables_type" class="form-select w-40">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (£)</option>
            </select>
            <div class="relative flex-1 max-w-[140px]">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {{ s.consumables_type === 'percentage' ? '%' : '£' }}
              </span>
              <input v-model="s.consumables_value" type="number" min="0" step="0.5" class="form-input pl-7" />
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 pt-4">
          <label class="form-label">VAT</label>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="s.include_vat" type="checkbox" true-value="true" false-value="false" class="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
              <span class="text-sm text-gray-700">Show VAT on PDFs</span>
            </label>
            <div class="flex items-center gap-2">
              <input v-model="s.vat_rate" type="number" min="0" max="100" step="1" class="form-input w-20 py-1.5" />
              <span class="text-sm text-gray-500">%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Terms -->
      <div v-show="activeTab === 'terms'" class="card p-6">
        <h2 class="section-title">Terms &amp; Conditions</h2>
        <p class="text-sm text-gray-500 mb-3">These appear at the bottom of every PDF quote.</p>
        <textarea v-model="s.terms_and_conditions" class="form-input" rows="12" />
      </div>

      <!-- Users -->
      <div v-show="activeTab === 'users'" class="space-y-4">
        <div class="card p-6">
          <h2 class="section-title">Engineer Accounts</h2>

          <div class="divide-y divide-gray-100">
            <div v-for="u in users" :key="u.id" class="flex items-center justify-between py-3">
              <div>
                <p class="font-medium text-gray-900">{{ u.name }}
                  <span v-if="u.is_admin" class="ml-2 text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-medium">Admin</span>
                </p>
                <p class="text-sm text-gray-400">{{ u.email }}</p>
              </div>
              <button
                class="text-gray-400 hover:text-red-500 transition-colors p-1"
                :disabled="u.id === auth.user?.id"
                :title="u.id === auth.user?.id ? 'Cannot delete your own account' : 'Delete user'"
                @click="deleteUser(u)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Add user form -->
        <div class="card p-6">
          <h2 class="section-title">Add Engineer Account</h2>
          <form class="grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="addUser">
            <div>
              <label class="form-label">Full name</label>
              <input v-model="newUser.name" type="text" class="form-input" required />
            </div>
            <div>
              <label class="form-label">Email address</label>
              <input v-model="newUser.email" type="email" class="form-input" required />
            </div>
            <div>
              <label class="form-label">Password</label>
              <input v-model="newUser.password" type="password" class="form-input" minlength="8" required />
            </div>
            <div class="flex items-end gap-3">
              <label class="flex items-center gap-2 mb-2 cursor-pointer">
                <input v-model="newUser.is_admin" type="checkbox" class="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                <span class="text-sm text-gray-700">Admin access</span>
              </label>
            </div>
            <div class="sm:col-span-2">
              <button type="submit" class="btn-primary">Add account</button>
              <p v-if="userError" class="text-red-500 text-sm mt-2">{{ userError }}</p>
            </div>
          </form>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const auth       = useAuthStore()
const saving     = ref(false)
const successMsg = ref('')
const error      = ref('')
const activeTab  = ref('company')
const users      = ref([])
const userError  = ref('')

const tabs = [
  { id: 'company', label: 'Company' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'terms',   label: 'Terms & Conditions' },
  { id: 'users',   label: 'Users' },
]

const s = reactive({
  company_name:         '',
  company_address:      '',
  company_phone:        '',
  company_email:        '',
  company_logo:         '',
  labour_rate:          '45.00',
  pipework_rate:        '12.00',
  consumables_type:     'percentage',
  consumables_value:    '5',
  include_vat:          'false',
  vat_rate:             '20',
  terms_and_conditions: '',
})

const newUser = reactive({ name: '', email: '', password: '', is_admin: false })

onMounted(async () => {
  const [settingsRes, usersRes] = await Promise.all([api.get('/settings'), api.get('/auth/users')])
  Object.assign(s, settingsRes.data)
  users.value = usersRes.data
})

function onLogoUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { s.company_logo = reader.result }
  reader.readAsDataURL(file)
}

async function save() {
  saving.value = true
  error.value  = ''
  try {
    await api.put('/settings', s)
    successMsg.value = 'Settings saved.'
    setTimeout(() => successMsg.value = '', 3000)
  } catch {
    error.value = 'Failed to save settings.'
  } finally {
    saving.value = false
  }
}

async function addUser() {
  userError.value = ''
  try {
    const { data } = await api.post('/auth/users', newUser)
    users.value.push(data)
    Object.assign(newUser, { name: '', email: '', password: '', is_admin: false })
  } catch (err) {
    userError.value = err.response?.data?.error || 'Failed to add user.'
  }
}

async function deleteUser(u) {
  if (!confirm(`Remove account for ${u.name}? They will no longer be able to log in.`)) return
  await api.delete(`/auth/users/${u.id}`)
  users.value = users.value.filter(x => x.id !== u.id)
}
</script>
