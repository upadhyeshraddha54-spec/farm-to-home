import { useState } from 'react'
import Input from './Input'

/** Password field with a working Show / Hide toggle. */
export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false)

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="rounded px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      }
    />
  )
}
