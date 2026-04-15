<template>
  <div class="card overflow-hidden">
    <!-- Collapsible header -->
    <button
      type="button"
      class="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      @click="open = !open"
    >
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span class="text-base font-semibold text-brand-800">BTU Calculator</span>
        <span class="text-xs text-gray-400 hidden sm:inline">(optional — helps size units)</span>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="totalBtu > 0" class="text-sm font-medium text-brand-700">
          {{ totalBtu.toLocaleString() }} BTU / {{ totalKw }} kW total
        </span>
        <svg
          class="w-4 h-4 text-gray-400 transition-transform"
          :class="{ 'rotate-180': open }"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>

    <div v-show="open" class="border-t border-gray-200">
      <div class="p-5 space-y-4">

        <!-- Room list -->
        <div v-if="localRooms.length" class="space-y-3">
          <div
            v-for="(room, i) in localRooms"
            :key="i"
            class="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <div class="flex items-start justify-between mb-3">
              <input
                v-model="room.name"
                type="text"
                class="font-medium text-gray-800 bg-transparent border-none outline-none text-sm w-full"
                placeholder="Room name (e.g. Living Room)"
                @change="emit"
              />
              <button type="button" class="text-gray-400 hover:text-red-500 transition-colors shrink-0 ml-2" @click="removeRoom(i)">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <label class="form-label text-xs">Length (m)</label>
                <input v-model.number="room.length" type="number" min="0" step="0.1" class="form-input py-1.5" @input="emit" />
              </div>
              <div>
                <label class="form-label text-xs">Width (m)</label>
                <input v-model.number="room.width" type="number" min="0" step="0.1" class="form-input py-1.5" @input="emit" />
              </div>
              <div>
                <label class="form-label text-xs">Height (m)</label>
                <input v-model.number="room.height" type="number" min="1" max="6" step="0.1" class="form-input py-1.5" placeholder="2.4" @input="emit" />
              </div>
              <div>
                <label class="form-label text-xs">Orientation</label>
                <select v-model="room.orientation" class="form-select py-1.5 text-sm" @change="emit">
                  <option value="north">North (cooler)</option>
                  <option value="east">East / West</option>
                  <option value="south">South (sunnier)</option>
                  <option value="conservatory">Conservatory / Full glazing</option>
                </select>
              </div>
              <div>
                <label class="form-label text-xs">Insulation</label>
                <select v-model="room.insulation" class="form-select py-1.5 text-sm" @change="emit">
                  <option value="good">Well insulated</option>
                  <option value="average">Average</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label class="form-label text-xs">Occupants</label>
                <input v-model.number="room.occupants" type="number" min="0" max="50" class="form-input py-1.5" placeholder="2" @input="emit" />
              </div>
            </div>

            <!-- Result -->
            <div v-if="roomBtu(room) > 0" class="mt-3 flex items-center gap-3 text-xs">
              <span class="px-2 py-1 bg-brand-100 text-brand-700 rounded-full font-medium">
                {{ roomBtu(room).toLocaleString() }} BTU
              </span>
              <span class="text-gray-400">≈ {{ (roomBtu(room) / 3412).toFixed(1) }} kW</span>
              <span class="text-gray-400">· Recommended: {{ recommendation(roomBtu(room)) }}</span>
            </div>
          </div>
        </div>

        <!-- Add room -->
        <button
          type="button"
          class="btn-secondary w-full border-dashed"
          @click="addRoom"
        >
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add room
        </button>

        <!-- Summary -->
        <div v-if="totalBtu > 0" class="bg-brand-50 rounded-lg p-4 border border-brand-200">
          <p class="text-sm font-semibold text-brand-800 mb-2">Total required capacity</p>
          <div class="flex flex-wrap gap-4 text-sm">
            <div>
              <span class="text-brand-600 font-bold text-xl">{{ totalBtu.toLocaleString() }}</span>
              <span class="text-brand-500 ml-1">BTU/hr</span>
            </div>
            <div>
              <span class="text-brand-600 font-bold text-xl">{{ totalKw }}</span>
              <span class="text-brand-500 ml-1">kW</span>
            </div>
          </div>
          <p class="text-xs text-brand-500 mt-2">
            These are estimates. Always verify with site survey and manufacturer specifications.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({ rooms: { type: Array, default: () => [] } })
const emits = defineEmits(['update'])

const open = ref(false)

function blankRoom() {
  return { name: '', length: '', width: '', height: 2.4, orientation: 'east', insulation: 'average', occupants: 2 }
}

const localRooms = ref(props.rooms.length ? props.rooms.map(r => ({ ...r })) : [])

watch(() => props.rooms, rooms => {
  if (rooms.length !== localRooms.value.length) {
    localRooms.value = rooms.map(r => ({ ...r }))
  }
}, { deep: true })

function emit() { emits('update', localRooms.value.map(r => ({ ...r }))) }

function addRoom() {
  localRooms.value.push(blankRoom())
  open.value = true
  emit()
}

function removeRoom(i) {
  localRooms.value.splice(i, 1)
  emit()
}

// ── BTU formula ─────────────────────────────────────────────────────────────
// Base: floor area × 337 BTU (industry rule of thumb for UK)
// Adjusted for ceiling height, orientation, insulation, occupants

const ORIENTATION_FACTOR = { north: 0.9, east: 1.0, south: 1.1, conservatory: 1.35 }
const INSULATION_FACTOR  = { good: 0.9, average: 1.0, poor: 1.15 }

function roomBtu(room) {
  const l = parseFloat(room.length) || 0
  const w = parseFloat(room.width)  || 0
  const h = parseFloat(room.height) || 2.4
  if (l === 0 || w === 0) return 0

  const area     = l * w
  const heightF  = h / 2.4                                // normalised to standard 2.4m ceiling
  const orientF  = ORIENTATION_FACTOR[room.orientation]  || 1.0
  const insulF   = INSULATION_FACTOR[room.insulation]    || 1.0
  const occupants = Math.max(0, (parseInt(room.occupants) || 2) - 2)

  return Math.round(area * 337 * heightF * orientF * insulF + occupants * 600)
}

function recommendation(btu) {
  if (btu <= 7000)  return '½ ton unit'
  if (btu <= 9000)  return '¾ ton unit'
  if (btu <= 12000) return '1 ton unit'
  if (btu <= 18000) return '1.5 ton unit'
  if (btu <= 24000) return '2 ton unit'
  if (btu <= 36000) return '3 ton unit'
  return `${Math.ceil(btu / 12000)} ton system`
}

const totalBtu = computed(() => localRooms.value.reduce((sum, r) => sum + roomBtu(r), 0))
const totalKw  = computed(() => (totalBtu.value / 3412).toFixed(1))
</script>
