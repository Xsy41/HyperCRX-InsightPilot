/**
 * Turbo visit event utilities
 * @zh-CN Turbo 访问事件工具
 *
 * There are two types of `turbo:visit`: "Restoration Visits" and "Application Visits",
 * and we can get the visit type by reading the `detail` property of `turbo:visit` event.
 * For more info, see https://turbo.hotwired.dev/handbook/building#understanding-caching
 */

/**
 * Type definitions for Turbo visit events
 */
export interface TurboVisitEventDetail {
  action: 'advance' | 'restore';
  [key: string]: unknown;
}

/**
 * Turbo visit event type
 */
export interface TurboVisitEvent extends CustomEvent {
  detail: TurboVisitEventDetail;
}

/**
 * Turbo visit action type
 */
export type TurboVisitAction = 'advance' | 'restore';

// Current visit type, default to 'advance'
let visitType: TurboVisitAction = 'advance';

// Event listener cleanup function
let cleanupListener: (() => void) | null = null;

/**
 * Initialize the restoration visit tracker
 * This function sets up the event listener for turbo:visit events
 * @example
 * ```ts
 * // Initialize the tracker (automatically called when module is loaded)
 * initializeRestorationVisitTracker();
 * ```
 */
function initializeRestorationVisitTracker(): void {
  // If already initialized, skip
  if (cleanupListener) {
    return;
  }

  // Event handler for turbo:visit events
  const handleTurboVisit = (event: Event): void => {
    try {
      // Type guard to check if event is a TurboVisitEvent
      const isTurboVisitEvent = (e: Event): e is TurboVisitEvent => {
        return (
          e instanceof CustomEvent &&
          e.detail &&
          typeof e.detail === 'object' &&
          (e.detail as Partial<TurboVisitEventDetail>).action !== undefined
        );
      };

      if (isTurboVisitEvent(event)) {
        const turboEvent = event as TurboVisitEvent;
        const detail = turboEvent.detail;

        if (detail.action === 'advance' || detail.action === 'restore') {
          visitType = detail.action;
        } else {
          console.warn(`Unexpected visit action: ${detail.action}, defaulting to 'advance'`);
          visitType = 'advance';
        }
      }
    } catch (error) {
      console.error('Error handling turbo:visit event:', error instanceof Error ? error.message : String(error));
      // Ensure we have a valid visitType even if there's an error
      visitType = 'advance';
    }
  };

  // Add event listener
  document.addEventListener('turbo:visit', handleTurboVisit);

  // Store cleanup function
  cleanupListener = () => {
    document.removeEventListener('turbo:visit', handleTurboVisit);
    cleanupListener = null;
    // Reset visit type on cleanup
    visitType = 'advance';
  };
}

/**
 * Cleanup the restoration visit tracker
 * This function removes the event listener for turbo:visit events
 * @example
 * ```ts
 * // Cleanup the tracker when no longer needed
 * cleanupRestorationVisitTracker();
 * ```
 */
export function cleanupRestorationVisitTracker(): void {
  if (cleanupListener) {
    cleanupListener();
  }
}

/**
 * Check if the current visit is a restoration visit
 * @returns true if the current visit is a restoration visit, false otherwise
 * @example
 * ```ts
 * // Check if current visit is a restoration visit
 * if (isRestorationVisit()) {
 *   // Handle restoration visit
 * }
 * ```
 */
export default function isRestorationVisit(): boolean {
  return visitType === 'restore';
}

/**
 * Check if the current visit is an advance visit
 * @returns true if the current visit is an advance visit, false otherwise
 * @example
 * ```ts
 * // Check if current visit is an advance visit
 * if (isAdvanceVisit()) {
 *   // Handle advance visit
 * }
 * ```
 */
export function isAdvanceVisit(): boolean {
  return visitType === 'advance';
}

/**
 * Get the current visit type
 * @returns Current visit type ('advance' or 'restore')
 * @example
 * ```ts
 * // Get current visit type
 * const currentVisitType = getCurrentVisitType();
 * ```
 */
export function getCurrentVisitType(): TurboVisitAction {
  return visitType;
}

/**
 * Manually set the visit type (useful for testing)
 * @param type The visit type to set
 * @example
 * ```ts
 * // Manually set visit type for testing
 * setVisitType('restore');
 * ```
 */
export function setVisitType(type: TurboVisitAction): void {
  if (type !== 'advance' && type !== 'restore') {
    throw new TypeError(`Invalid visit type: ${type}. Expected 'advance' or 'restore'`);
  }
  visitType = type;
}

// Initialize the tracker when the module is loaded
initializeRestorationVisitTracker();
