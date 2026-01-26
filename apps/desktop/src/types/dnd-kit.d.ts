/**
 * Type declarations to fix @dnd-kit compatibility with React 19 types.
 *
 * The @dnd-kit library uses React 18 types which conflict with React 19.
 * This declaration extends the JSX namespace to accept the DndContext component.
 */
import '@dnd-kit/core';

declare module '@dnd-kit/core' {
  // Re-declare DndContext to be compatible with React 19 JSX
  export const DndContext: React.FC<import('@dnd-kit/core').DndContextProps>;
}
