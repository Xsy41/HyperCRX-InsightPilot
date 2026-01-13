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

/**
 * Visit history entry
 */
export interface VisitHistoryEntry {
  /** Visit type */
  type: TurboVisitAction;
  /** Visit timestamp */
  timestamp: number;
  /** Event detail from the turbo:visit event */
  detail?: TurboVisitEventDetail;
}

/**
 * Visit change listener type
 */
export type VisitChangeListener = (
  newType: TurboVisitAction,
  oldType: TurboVisitAction,
  entry: VisitHistoryEntry
) => void;

// Current visit type, default to 'advance'
let visitType: TurboVisitAction = 'advance';

// Previous visit type, for detecting changes
let previousVisitType: TurboVisitAction = 'advance';

// Event listener cleanup function
let cleanupListener: (() => void) | null = null;

// Visit history records
let visitHistory: VisitHistoryEntry[] = [];

// Maximum number of history entries to keep
const MAX_HISTORY_ENTRIES = 10;

// Visit change listeners
let visitChangeListeners: Set<VisitChangeListener> = new Set();

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

  // Create initial history entry
  const initialEntry: VisitHistoryEntry = {
    type: visitType,
    timestamp: Date.now(),
  };
  visitHistory.push(initialEntry);

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

        let newVisitType: TurboVisitAction;
        if (detail.action === 'advance' || detail.action === 'restore') {
          newVisitType = detail.action;
        } else {
          console.warn(`Unexpected visit action: ${detail.action}, defaulting to 'advance'`);
          newVisitType = 'advance';
        }

        // Create history entry
        const historyEntry: VisitHistoryEntry = {
          type: newVisitType,
          timestamp: Date.now(),
          detail,
        };

        // Update visit type
        previousVisitType = visitType;
        visitType = newVisitType;

        // Add to history and limit size
        visitHistory.push(historyEntry);
        if (visitHistory.length > MAX_HISTORY_ENTRIES) {
          visitHistory.shift();
        }

        // Notify listeners of visit type change
        if (previousVisitType !== newVisitType) {
          visitChangeListeners.forEach((listener) => {
            try {
              listener(newVisitType, previousVisitType, historyEntry);
            } catch (error) {
              console.error('Error in visit change listener:', error instanceof Error ? error.message : String(error));
            }
          });
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
    // Reset state on cleanup
    visitType = 'advance';
    previousVisitType = 'advance';
    visitHistory = [];
    visitChangeListeners.clear();
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

/**
 * Add a listener for visit type changes
 * @param listener The listener function to add
 * @returns A function to remove the listener
 * @example
 * ```ts
 * // Add a visit change listener
 * const removeListener = addVisitChangeListener((newType, oldType, entry) => {
 *   console.log(`Visit type changed from ${oldType} to ${newType} at ${new Date(entry.timestamp)}`);
 * });
 *
 * // Remove the listener when no longer needed
 * removeListener();
 * ```
 */
export function addVisitChangeListener(listener: VisitChangeListener): () => void {
  visitChangeListeners.add(listener);

  // Return a function to remove the listener
  return () => {
    visitChangeListeners.delete(listener);
  };
}

/**
 * Remove a listener for visit type changes
 * @param listener The listener function to remove
 * @example
 * ```ts
 * const myListener = (newType, oldType, entry) => {
 *   console.log(`Visit type changed: ${oldType} → ${newType}`);
 * };
 *
 * addVisitChangeListener(myListener);
 * // ... later
 * removeVisitChangeListener(myListener);
 * ```
 */
export function removeVisitChangeListener(listener: VisitChangeListener): void {
  visitChangeListeners.delete(listener);
}

/**
 * Get the visit history
 * @returns An array of visit history entries
 * @example
 * ```ts
 * // Get the visit history
 * const history = getVisitHistory();
 * console.log(`Total visits: ${history.length}`);
 * console.log(`Last visit: ${history[history.length - 1].type} at ${new Date(history[history.length - 1].timestamp)}`);
 * ```
 */
export function getVisitHistory(): readonly VisitHistoryEntry[] {
  return [...visitHistory];
}

/**
 * Clear the visit history
 * @example
 * ```ts
 * // Clear all visit history
 * clearVisitHistory();
 * ```
 */
export function clearVisitHistory(): void {
  visitHistory = [];
  // Add the current visit as the new initial entry
  visitHistory.push({
    type: visitType,
    timestamp: Date.now(),
  });
}

/**
 * Get the previous visit type
 * @returns The previous visit type, or null if no previous visit
 * @example
 * ```ts
 * // Get the previous visit type
 * const previousType = getPreviousVisitType();
 * if (previousType) {
 *   console.log(`Previous visit was: ${previousType}`);
 * }
 * ```
 */
export function getPreviousVisitType(): TurboVisitAction {
  return previousVisitType;
}

/**
 * Check if the visit type has changed from the previous visit
 * @returns True if the visit type has changed, false otherwise
 * @example
 * ```ts
 * // Check if visit type changed
 * if (hasVisitTypeChanged()) {
 *   console.log('Visit type changed from previous visit');
 * }
 * ```
 */
export function hasVisitTypeChanged(): boolean {
  return visitType !== previousVisitType;
}

/**
 * Reset the restoration visit tracker
 * This will clear all history and listeners, and reinitialize the tracker
 * @example
 * ```ts
 * // Reset the tracker
 * resetRestorationVisitTracker();
 * ```
 */
export function resetRestorationVisitTracker(): void {
  // Cleanup existing tracker
  cleanupRestorationVisitTracker();

  // Reinitialize the tracker
  initializeRestorationVisitTracker();
}

// Initialize the tracker when the module is loaded
initializeRestorationVisitTracker();
