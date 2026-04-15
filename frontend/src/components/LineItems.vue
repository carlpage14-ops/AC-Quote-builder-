<template>
  <div class="space-y-4">

    <!-- AC Units -->
    <div class="card p-5">
      <h2 class="section-title">AC Units &amp; Equipment</h2>
      <div class="space-y-2">
        <!-- Header row (desktop only) -->
        <div class="hidden sm:grid sm:grid-cols-12 gap-2 text-xs text-gray-500 font-medium px-1">
          <span class="col-span-7">Description</span>
          <span class="col-span-2 text-center">Qty</span>
          <span class="col-span-2 text-right">Unit price (£)</span>
          <span class="col-span-1"></span>
        </div>

        <div v-for="(unit, i) in form.units" :key="i" class="grid grid-cols-12 gap-2 items-start">
          <div class="col-span-12 sm:col-span-7">
            <input
              v-model="unit.description"
              type="text"
              class="form-input text-sm"
              placeholder="e.g. Mitsubishi 3.5kW MSZ-LN35VGW wall unit"
            />
          </div>
          <div class="col-span-4 sm:col-span-2">
            <input v-model.number="unit.qty" type="number" min="1" class="form-input text-sm text-center" placeholder="1" />
          </div>
          <div class="col-span-6 sm:col-span-2">
            <div class="relative">
              <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
              <input v-model="unit.unit_price" type="number" min="0" step="0.01" class="form-input pl-6 text-sm text-right" placeholder="0.00" />
            </div>
          </div>
          <div class="col-span-2 sm:col-span-1 flex justify-end">
            <button
              type="button"
              class="mt-1 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              :disabled="form.units.length === 1"
              @click="removeUnit(i)"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <!-- Line total (mobile) -->
          <div v-if="lineTotal(unit) > 0" class="col-span-12 sm:hidden text-right text-xs text-gray-500 pr-8 -mt-1">
            = {{ fmtLine(lineTotal(unit)) }}
          </div>
        </div>

        <!-- Line totals column (desktop) shown beside rows -->
        <div v-for="(unit, i) in form.units" :key="'lt-' + i" class="hidden sm:block">
          <!-- handled inline, this is just for the add button spacing -->
        </div>

        <button type="button" class="btn-secondary text-sm mt-2" @click="addUnit">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add unit / item
        </button>
      </div>
    </div>

    <!-- Pipework -->
    <div class="card p-5">
      <h2 class="section-title">Pipework &amp; Refrigerant Lines</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="form-label">Run length (metres)</label>
          <input v-model="form.pipework.metres" type="number" min="0" step="0.5" class="form-input" placeholder="0" />
        </div>
        <div>
          <label class="form-label">Price per metre (£)</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
            <input v-model="form.pipework.price_per_metre" type="number" min="0" step="0.50" class="form-input pl-7" :placeholder="settings.pipework_rate || '12.00'" />
          </div>
        </div>
        <div class="flex items-end">
          <div class="w-full bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200">
            <p class="text-xs text-gray-500">Section total</p>
            <p class="font-semibold text-gray-900">{{ fmtLine(pipeworkTotal) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Electrical -->
    <div class="card p-5">
      <h2 class="section-title">Electrical Works</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="sm:col-span-2">
          <label class="form-label">Description</label>
          <input
            v-model="form.electrical.description"
            type="text"
            class="form-input"
            placeholder="e.g. New 32A circuit, isolator, wiring to outdoor unit"
          />
        </div>
        <div>
          <label class="form-label">Total cost (£)</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
            <input v-model="form.electrical.cost" type="number" min="0" step="1" class="form-input pl-7" placeholder="0.00" />
          </div>
        </div>
      </div>
    </div>

    <!-- Labour -->
    <div class="card p-5">
      <h2 class="section-title">Labour</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="form-label">Hours</label>
          <input v-model="form.labour.hours" type="number" min="0" step="0.5" class="form-input" placeholder="8" />
        </div>
        <div>
          <label class="form-label">Hourly rate (£)</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">£</span>
            <input v-model="form.labour.rate" type="number" min="0" step="0.50" class="form-input pl-7" :placeholder="settings.labour_rate || '45.00'" />
          </div>
        </div>
        <div class="flex items-end">
          <div class="w-full bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-200">
            <p class="text-xs text-gray-500">Section total</p>
            <p class="font-semibold text-gray-900">{{ fmtLine(labourTotal) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Consumables -->
    <div class="card p-5">
      <h2 class="section-title">Consumables &amp; Sundry Materials</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="form-label">Type</label>
          <div class="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              type="button"
              :class="['px-4 py-2 text-sm font-medium transition-colors', form.consumables.type === 'percentage' ? 'bg-brand-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50']"
              @click="form.consumables.type = 'percentage'"
            >
              % of parts
            </button>
            <button
              type="button"
              :class="['px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300', form.consumables.type === 'fixed' ? 'bg-brand-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50']"
              @click="form.consumables.type = 'fixed'"
            >
              Fixed £
            </button>
          </div>
        </div>
        <div>
          <label class="form-label">
            {{ form.consumables.type === 'percentage' ? 'Percentage (%)' : 'Amount (£)' }}
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {{ form.consumables.type === 'percentage' ? '%' : '£' }}
            </span>
            <input v-model="form.consumables.value" type="number" min="0" step="0.5" class="form-input pl-7 w-32" placeholder="5" />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  form:     { type: Object, required: true },
  settings: { type: Object, default: () => ({}) },
})

function fmtLine(n) { return `£${parseFloat(n || 0).toFixed(2)}` }

function lineTotal(u) {
  return (parseFloat(u.qty) || 0) * (parseFloat(u.unit_price) || 0)
}

const pipeworkTotal = computed(() =>
  (parseFloat(props.form.pipework.metres) || 0) * (parseFloat(props.form.pipework.price_per_metre) || 0),
)

const labourTotal = computed(() =>
  (parseFloat(props.form.labour.hours) || 0) * (parseFloat(props.form.labour.rate) || 0),
)

function addUnit() {
  props.form.units.push({ description: '', qty: 1, unit_price: '' })
}

function removeUnit(i) {
  if (props.form.units.length > 1) props.form.units.splice(i, 1)
}
</script>
