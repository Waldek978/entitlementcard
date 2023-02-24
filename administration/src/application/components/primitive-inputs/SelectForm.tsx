import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material'
import { useContext, useState } from 'react'
import { Form } from '../../FormType'
import { ShortTextInput } from '../../../generated/graphql'
import { FormContext } from '../SteppedSubForms'

type State = { selectedText: string }
type ValidatedInput = ShortTextInput
type Options = string[]
type AdditionalProps = { label: string; defaultValue?: string }
const SelectForm: Form<State, Options, ValidatedInput, AdditionalProps> = {
  initialState: { selectedText: '' },
  getArrayBufferKeys: () => [],
  validate: ({ selectedText }, options) => {
    if (selectedText.length === 0) return { type: 'error', message: 'Feld ist erforderlich.' }
    if (!options.includes(selectedText))
      return {
        type: 'error',
        message: `Wert muss einer der auswählbaren Optionen entsprechen.`,
      }
    return { type: 'valid', value: { shortText: selectedText } }
  },
  Component: ({ state, setState, label, options, defaultValue }) => {
    const [touched, setTouched] = useState(false)
    const { showAllErrors, disableAllInputs } = useContext(FormContext)
    const validationResult = SelectForm.validate(state, options)
    const isInvalid = validationResult.type === 'error'

    return (
      <FormControl fullWidth variant='standard' required style={{ margin: '4px 0' }} error={touched && isInvalid}>
        <InputLabel>{label}</InputLabel>
        <Select
          disabled={disableAllInputs}
          value={defaultValue ?? state.selectedText}
          label={label}
          onBlur={() => setTouched(true)}
          onChange={e => setState(() => ({ selectedText: e.target.value }))}>
          {options.map(item => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </Select>
        {(showAllErrors || touched) && isInvalid ? <FormHelperText>{validationResult.message}</FormHelperText> : null}
      </FormControl>
    )
  },
}

export default SelectForm
