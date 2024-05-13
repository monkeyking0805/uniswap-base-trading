import './index.css'

import React from 'react'
import ReactDOM from 'react-dom/client'

import Test from './test/Test'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Test />
  </React.StrictMode>
)
