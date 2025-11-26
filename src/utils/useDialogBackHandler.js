import { watch, onUnmounted, ref, isRef } from 'vue'

/**
 * Generic back-button/browser back handler for dialogs.
 * - Pushes a history state when the main dialog opens, removes on close.
 * - Intercepts popstate: closes child dialog first (if provided), otherwise calls onClose.
 * - Keeps history stack balanced when dialogs are closed manually via returned beforeManualClose().
 *
 * @param {import('vue').Ref<boolean> | (()=>boolean)} when - reactive show condition or getter
 * @param {() => void} onClose - called to close the main dialog
 * @param {import('vue').Ref<boolean>} [childOpenRef] - optional ref for nested/secondary dialog
 */
export function useDialogBackHandler(when, onClose, childOpenRef) {
  const hasMainHistory = ref(false)
  const isHandlingPopState = ref(false)

  const getShown = () => (typeof when === 'function' ? when() : when?.value)

  const onPopState = () => {
    isHandlingPopState.value = true
    try {
      if (childOpenRef && childOpenRef.value) {
        // Close child first, then restore one state for the main dialog layer
        childOpenRef.value = false
        window.history.pushState(null, '', document.URL)
        return
      }
      onClose?.()
    } finally {
      isHandlingPopState.value = false
    }
  }

  // Watch main dialog visibility
  watch(
    when,
    (v) => {
      if (v) {
        if (!hasMainHistory.value) {
          window.history.pushState(null, '', document.URL)
          hasMainHistory.value = true
        }
        window.addEventListener('popstate', onPopState, false)
      } else {
        window.removeEventListener('popstate', onPopState, false)
        hasMainHistory.value = false
      }
    },
    { immediate: true }
  )

  // Watch child dialog visibility (if any)
  if (childOpenRef) {
    watch(childOpenRef, (v, ov) => {
      if (v) {
        window.history.pushState(null, '', document.URL)
      } else if (ov) {
        if (!isHandlingPopState.value) {
          // Manual close of child: pop the extra state we pushed for it
          window.history.back()
        }
      }
    })
  }

  onUnmounted(() => {
    window.removeEventListener('popstate', onPopState, false)
  })

  // Call this before emitting manual close of the main dialog
  const beforeManualClose = () => {
    if (hasMainHistory.value && !isHandlingPopState.value) {
      window.history.back()
    }
    hasMainHistory.value = false
  }

  return { beforeManualClose }
}
