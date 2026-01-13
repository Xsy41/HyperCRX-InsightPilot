/**
 * There are two types of `turbo:visit`: "Restoration Visits" and "Application Visits",
 * and we can get the visit type by reading the `detail` property of `turbo:visit` event.
 * For more info, see https://turbo.hotwired.dev/handbook/building#understanding-caching
 */
let visitType: 'advance' | 'restore' = 'advance';

// Listen for turbo:visit events to track the visit type
document.addEventListener('turbo:visit', (event: CustomEvent) => {
  // Ensure the event has the expected detail structure
  if (event.detail && typeof event.detail.action === 'string') {
    visitType = event.detail.action as 'advance' | 'restore';
  }
});

/**
 * Check if the current visit is a restoration visit
 * @returns true if the current visit is a restoration visit, false otherwise
 */
export default function isRestorationVisit(): boolean {
  return visitType === 'restore';
}
