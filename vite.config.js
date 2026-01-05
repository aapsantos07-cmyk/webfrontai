import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react-useanimations',
      'react-useanimations/lib/loading',
      'react-useanimations/lib/loading2',
      'react-useanimations/lib/menu2',
      'react-useanimations/lib/menu3',
      'react-useanimations/lib/trash',
      'react-useanimations/lib/trash2',
      'react-useanimations/lib/plusToX',
      'react-useanimations/lib/settings',
      'react-useanimations/lib/settings2',
      'react-useanimations/lib/download',
      'react-useanimations/lib/lock',
      'react-useanimations/lib/activity',
      'react-useanimations/lib/alertTriangle',
      'react-useanimations/lib/alertCircle',
      'react-useanimations/lib/searchToX',
      'react-useanimations/lib/checkBox',
    ],
  },
  build: {
    commonjsOptions: {
      include: [/react-useanimations/, /node_modules/],
    },
  },
})
