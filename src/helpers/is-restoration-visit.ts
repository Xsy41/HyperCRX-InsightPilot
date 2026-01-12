/**
 * Type definitions for Turbo visit events
 */
interface TurboVisitEventDetail {
  action: 'advance' | 'restore';
  [key: string]: unknown;
}

interface TurboVisitEvent extends CustomEvent {
  detail: TurboVisitEventDetail;
}

/**
 * There are two types of `turbo:visit`: "Restoration Visits" and "Application Visits",
 * and we can get the visit type by reading the `detail` property of `turbo:visit` event.
 * For more info, see https://turbo.hotwired.dev/handbook/building#understanding-caching
 */

// Current visit type, default to 'advance'
let visitType: 'advance' | 'restore' = 'advance';

// Event listener cleanup function
let cleanupListener: (() => void) | null = null;

/**
 * Initialize the restoration visit tracker
 * This function sets up the event listener for turbo:visit events
 */
function initializeRestorationVisitTracker(): void {
  // If already initialized, skip
  if (cleanupListener) {
    return;
  }

  // Event handler for turbo:visit events
  const handleTurboVisit = (event: Event): void => {
    try {
      const turboEvent = event as TurboVisitEvent;

      // Validate event structure
      if (turboEvent.detail && typeof turboEvent.detail === 'object') {
        const detail = turboEvent.detail as Partial<TurboVisitEventDetail>;
        if (detail.action === 'advance' || detail.action === 'restore') {
          visitType = detail.action;
        } else {
          console.warn(`Unexpected visit action: ${detail.action}, defaulting to 'advance'`);
          visitType = 'advance';
        }
      }
    } catch (error) {
      console.error('Error handling turbo:visit event:', error);
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
  };
}

/**
 * Cleanup the restoration visit tracker
 * This function removes the event listener for turbo:visit events
 */
export function cleanupRestorationVisitTracker(): void {
  if (cleanupListener) {
    cleanupListener();
  }
}

/**
 * Check if the current visit is a restoration visit
 * @returns true if the current visit is a restoration visit, false otherwise
 */
export default function isRestorationVisit(): boolean {
  return visitType === 'restore';
}

// Initialize the tracker when the module is loaded
initializeRestorationVisitTracker();
