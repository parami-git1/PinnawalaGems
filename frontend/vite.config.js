import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import { fileURLToPath } from 'node:url'

const fiberCompatPath = fileURLToPath(new URL('./src/threeFiberCompat.js', import.meta.url))

// Redirect `three` imports from both @react-three/fiber AND @react-three/drei
// to our compat shim that re-exports everything but substitutes FiberTimerClock
// for the deprecated Clock class. This silences the THREE.Clock deprecation
// warning in both development and production.
const fiberTimerCompat = () => ({
  name: 'fiber-timer-compat',
  resolveId(source, importer) {
    if (source === 'three' && /[/\\]@react-three[/\\]/.test(importer || '')) return fiberCompatPath
    return null
  },
  // During dev pre-bundling, the resolveId hook may not fully prevent the
  // shared three chunk from including the original Clock constructor warning.
  // Strip the deprecated warn() call from Clock.js so the class is still
  // exported (for compatibility) but no longer emits a console warning.
  transform(code, id) {
    if (/[\\/]three[\\/]/.test(id) && code.includes('Clock: This module has been deprecated')) {
      return code.replace(
        /warn\(\s*['"]Clock: This module has been deprecated[^'"]*['"]\s*\)\s*;?\s*\/\/[^\n]*/,
        '/* Clock deprecation warning removed by fiber-timer-compat */'
      )
    }
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [{ ...fiberTimerCompat(), enforce: 'pre' }, react()],
  // Vite's development optimizer has its own resolver. Apply the same scoped
  // compatibility there so development and production use identical timing.
  optimizeDeps: {
    rolldownOptions: { plugins: [fiberTimerCompat()] },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  build: {
    // Split the heavy Three.js library from the R3F/drei runtime and app code
    // so returning visitors cache the rarely-changing engine separately.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three-engine', test: /[\\/]node_modules[\\/]three[\\/]/ },
          ],
        },
      },
    },
  },
})
