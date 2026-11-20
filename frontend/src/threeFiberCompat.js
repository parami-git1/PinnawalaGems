// Only the renderer resolves this namespace. Application code and other Three
// dependencies keep their normal imports and share the same Three instances.
export * from 'three';
export { FiberTimerClock as Clock } from './FiberTimerClock.js';
