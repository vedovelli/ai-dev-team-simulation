/**
 * Utility functions for reordering operations
 * Pure functions for list manipulation - safe for testing and concurrent usage
 */

/**
 * Move an item from one position to another in an array
 *
 * Pure function that returns a new array without modifying the original.
 * Useful for keyboard navigation and programmatic reordering.
 *
 * @param items - The array to reorder
 * @param fromIndex - Current position of the item
 * @param toIndex - Desired position of the item
 * @returns New array with item moved to new position
 *
 * @example
 * ```ts
 * const tasks = [taskA, taskB, taskC, taskD]
 * const reordered = moveTaskInList(tasks, 0, 2)
 * // Result: [taskB, taskC, taskA, taskD]
 * ```
 */
export function moveTaskInList<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  // Validate indices
  if (
    fromIndex < 0 ||
    fromIndex >= items.length ||
    toIndex < 0 ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items
  }

  // Create a new array and remove the item from its original position
  const newItems = [...items]
  const [movedItem] = newItems.splice(fromIndex, 1)

  // Insert the item at its new position
  newItems.splice(toIndex, 0, movedItem)

  return newItems
}
