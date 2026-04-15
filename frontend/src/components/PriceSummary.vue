<template>
  <div class="card p-5">
    <h2 class="section-title">Price Summary</h2>

    <div class="space-y-2 text-sm">
      <div class="flex justify-between text-gray-600">
        <span>Units &amp; equipment</span>
        <span>{{ fmt(unitsTotal) }}</span>
      </div>
      <div class="flex justify-between text-gray-600">
        <span>Pipework</span>
        <span>{{ fmt(pipeworkTotal) }}</span>
      </div>
      <div class="flex justify-between text-gray-600">
        <span>Electrical</span>
        <span>{{ fmt(electricalTotal) }}</span>
      </div>
      <div class="flex justify-between text-gray-600">
        <span>Labour ({{ form.labour.hours || 0 }} hrs)</span>
        <span>{{ fmt(labourTotal) }}</span>
      </div>
      <div class="flex justify-between text-gray-600">
        <span>
          Consumables
          <span v-if="form.consumables.type === 'percentage' && parseFloat(form.consumables.value) > 0" class="text-gray-400">
            ({{ form.consumables.value }}%)
          </span>
        </span>
        <span>{{ fmt(consumablesTotal) }}</span>
      </div>

      <div class="border-t border-gray-200 pt-2 mt-2 flex justify-between font-medium text-gray-700">
        <span>Subtotal</span>
        <span>{{ fmt(subtotal) }}</span>
      </div>

      <!-- VAT row (only if enabled in settings) -->
      <div v-if="showVat" class="flex justify-between text-gray-600">
        <span>VAT ({{ settings.vat_rate }}%)</span>
        <span>{{ fmt(vatAmount) }}</span>
      </div>

      <!-- Grand total -->
      <div class="bg-brand-800 text-white rounded-lg px-4 py-3 flex justify-between items-center mt-3">
        <span class="font-semibold text-sm">{{ showVat ? 'Total (inc. VAT)' : 'Total' }}</span>
        <span class="text-xl font-bold">{{ fmt(total) }}</span>
      </div>
    </div>

    <!-- Zero state hint -->
    <p v-if="total === 0" class="text-xs text-gray-400 mt-3 text-center">
      Fill in the line items to see a live total
    </p>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  form:     { type: Object, required: true },
  settings: { type: Object, default: () => ({}) },
})
const emits = defineEmits(['totals'])

function fmt(n) { return `£${parseFloat(n || 0).toFixed(2)}` }

const unitsTotal = computed(() =>
  (props.form.units || []).reduce((sum, u) => sum + (parseFloat(u.qty) || 0) * (parseFloat(u.unit_price) || 0), 0),
)
const pipeworkTotal = computed(() =>
  (parseFloat(props.form.pipework?.metres) || 0) * (parseFloat(props.form.pipework?.price_per_metre) || 0),
)
const electricalTotal = computed(() => parseFloat(props.form.electrical?.cost) || 0)
const labourTotal     = computed(() =>
  (parseFloat(props.form.labour?.hours) || 0) * (parseFloat(props.form.labour?.rate) || 0),
)
const subtotal = computed(() => unitsTotal.value + pipeworkTotal.value + electricalTotal.value + labourTotal.value)

const consumablesTotal = computed(() => {
  const val = parseFloat(props.form.consumables?.value) || 0
  return props.form.consumables?.type === 'percentage'
    ? subtotal.value * (val / 100)
    : val
})

const showVat  = computed(() => props.settings.include_vat === 'true')
const vatRate  = computed(() => parseFloat(props.settings.vat_rate || '20') / 100)
const vatAmount = computed(() => (subtotal.value + consumablesTotal.value) * vatRate.value)

const total = computed(() => {
  const pre = subtotal.value + consumablesTotal.value
  return showVat.value ? pre + vatAmount.value : pre
})

// Emit totals up to QuoteView so they can be saved
watch([subtotal, total], () => {
  emits('totals', { subtotal: subtotal.value, total: total.value })
}, { immediate: true })
</script>
