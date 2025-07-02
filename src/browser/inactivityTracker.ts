/**
 * Focus/Blur based inactivity tracker for code-server running in iframe
 * Tracks user activity and notifies parent application about inactivity after 5 minutes
 */

interface InactivityMessage {
  type: "CODESERVER_INACTIVITY"
  status: "ready" | "active" | "blur" | "inactive"
  timestamp: number
  isActive: boolean
  timeout?: number
  initialState?: string
}

interface TrackerStatus {
  isActive: boolean
  isInitialized: boolean
  isInIframe: boolean
  hasTimer: boolean
  timeout: number
}

class InactivityTracker {
  private readonly INACTIVITY_TIMEOUT: number = 1 * 60 * 1000 // 5 minutes in milliseconds
  private timer: number | null = null
  private isActive: boolean = true
  private isInitialized: boolean = false
  private debugMode: boolean = false
  private isInIframe: boolean = false

  constructor() {
    // Bind methods to preserve context
    this.onFocus = this.onFocus.bind(this)
    this.onBlur = this.onBlur.bind(this)
    this.onVisibilityChange = this.onVisibilityChange.bind(this)
    this.onBeforeUnload = this.onBeforeUnload.bind(this)

    // Always log constructor call
    console.log("[InactivityTracker] Constructor called")
  }

  /**
   * Initialize the inactivity tracker
   */
  init(): void {
    if (this.isInitialized) {
      this.log("InactivityTracker already initialized")
      return
    }

    try {
      // Check if we're in an iframe
      this.isInIframe = window.self !== window.top
      console.log("[InactivityTracker] Iframe check:", this.isInIframe ? "Running in iframe" : "Not in iframe")

      if (!this.isInIframe) {
        console.log("[InactivityTracker] Not running in iframe, inactivity tracking disabled")
        return
      }

      // Window focus/blur events
      window.addEventListener("focus", this.onFocus, { passive: true })
      window.addEventListener("blur", this.onBlur, { passive: true })

      // Document visibility change (tab switching)
      document.addEventListener("visibilitychange", this.onVisibilityChange, { passive: true })

      // Page unload cleanup
      window.addEventListener("beforeunload", this.onBeforeUnload, { passive: true })

      // Initial state - assume active
      this.isActive = !document.hidden && document.hasFocus()

      this.isInitialized = true
      console.log("[InactivityTracker] Successfully initialized with 5-minute timeout")
      console.log("[InactivityTracker] Initial state:", this.isActive ? "active" : "inactive")

      // Notify parent that tracker is ready
      this.notifyParent("ready", {
        timeout: this.INACTIVITY_TIMEOUT,
        initialState: this.isActive ? "active" : "inactive",
      })

      // Start timer if initially not active
      if (!this.isActive) {
        this.startTimer()
      }
    } catch (error) {
      console.error("Failed to initialize InactivityTracker:", error)
    }
  }

  /**
   * Handle window focus event
   */
  private onFocus(): void {
    if (!this.isInitialized) return

    console.log("[InactivityTracker] Window focused - user is active")
    this.clearTimer()
    this.setActiveState(true)
  }

  /**
   * Handle window blur event
   */
  private onBlur(): void {
    if (!this.isInitialized) return

    console.log("[InactivityTracker] Window blurred - starting inactivity timer")
    this.setActiveState(false)
    this.startTimer()
  }

  /**
   * Handle document visibility change (tab switching)
   */
  private onVisibilityChange(): void {
    if (!this.isInitialized) return

    if (document.hidden) {
      console.log("[InactivityTracker] Tab/window hidden - starting inactivity timer")
      this.setActiveState(false)
      this.startTimer()
    } else {
      console.log("[InactivityTracker] Tab/window visible - user is active")
      this.clearTimer()
      this.setActiveState(true)
    }
  }

  /**
   * Handle page unload
   */
  private onBeforeUnload(): void {
    this.cleanup()
  }

  /**
   * Set active state and notify parent if changed
   */
  private setActiveState(isActive: boolean): void {
    if (this.isActive !== isActive) {
      this.isActive = isActive
      console.log("[InactivityTracker] State changed to:", isActive ? "ACTIVE" : "INACTIVE")
      this.notifyParent(isActive ? "active" : "blur")
    }
  }

  /**
   * Start the inactivity timer
   */
  private startTimer(): void {
    this.clearTimer()

    console.log(`[InactivityTracker] ⏱ Starting inactivity timer for ${this.INACTIVITY_TIMEOUT / 1000} seconds`)

    this.timer = window.setTimeout(() => {
      console.log("[InactivityTracker] 🚨 INACTIVITY TIMEOUT REACHED - User inactive for 5 minutes!")
      this.notifyParent("inactive")
    }, this.INACTIVITY_TIMEOUT)
  }

  /**
   * Clear the inactivity timer
   */
  private clearTimer(): void {
    if (this.timer) {
      console.log("[InactivityTracker] ✅ Clearing inactivity timer - User is active")
      window.clearTimeout(this.timer)
      this.timer = null
    }
  }

  /**
   * Notify parent window about activity status
   */
  private notifyParent(status: InactivityMessage["status"], extraData: Partial<InactivityMessage> = {}): void {
    if (!this.isInIframe) {
      this.log("Not in iframe, skipping parent notification")
      return
    }

    try {
      const message: InactivityMessage = {
        type: "CODESERVER_INACTIVITY",
        status: status,
        timestamp: Date.now(),
        isActive: this.isActive,
        ...extraData,
      }

      console.log("[InactivityTracker] 📤 Sending message to parent:", message)

      // Send to parent with wildcard origin for maximum compatibility
      // NOTE: Using "*" origin is a security consideration - in production,
      // consider using a specific origin or allowing origin configuration
      window.parent.postMessage(message, "*")
    } catch (error) {
      console.error("Failed to notify parent:", error)
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (!this.isInitialized) return

    this.log("Cleaning up InactivityTracker")

    this.clearTimer()

    // Remove event listeners
    window.removeEventListener("focus", this.onFocus)
    window.removeEventListener("blur", this.onBlur)
    document.removeEventListener("visibilitychange", this.onVisibilityChange)
    window.removeEventListener("beforeunload", this.onBeforeUnload)

    this.isInitialized = false
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.debugMode) {
      console.log("[InactivityTracker]", ...args)
    }
  }

  /**
   * Enable debug mode
   */
  enableDebug(): void {
    this.debugMode = true
    this.log("Debug mode enabled")
  }

  /**
   * Get current status
   */
  getStatus(): TrackerStatus {
    return {
      isActive: this.isActive,
      isInitialized: this.isInitialized,
      isInIframe: this.isInIframe,
      hasTimer: !!this.timer,
      timeout: this.INACTIVITY_TIMEOUT,
    }
  }
}

// Extend window interface to include the tracker
declare global {
  interface Window {
    inactivityTracker?: InactivityTracker
  }
}

// Export something to make this a module
export {}

// Initialize when DOM is ready
function initializeTracker(): void {
  console.log("[InactivityTracker] 🚀 Initializing inactivity tracker...")
  const tracker = new InactivityTracker()

  // Expose tracker to window for debugging
  window.inactivityTracker = tracker

  // Initialize the tracker
  tracker.init()

  // Enable debug mode if specified in URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get("debug_inactivity") === "true") {
    tracker.enableDebug()
    console.log("[InactivityTracker] Debug mode enabled via URL parameter")
  }

  console.log("[InactivityTracker] Tracker available as window.inactivityTracker for debugging")
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeTracker)
} else {
  initializeTracker()
}

// Also initialize on window load as fallback
window.addEventListener("load", initializeTracker)
