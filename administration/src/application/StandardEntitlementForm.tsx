import { Alert, Button } from '@mui/material'
import {
  initialWorkAtOrganizationFormState,
  WorkAtOrganizationForm,
  WorkAtOrganizationFormState,
} from './WorkAtOrganizationForm'

export type StandardEntitlementFormState = { key: number; value: WorkAtOrganizationFormState }[]

export const initialStandardEntitlementFormState: StandardEntitlementFormState = [
  {
    key: 0,
    value: initialWorkAtOrganizationFormState,
  },
]

export const StandardEntitlementForm = ({
  state,
  setState,
}: {
  state: StandardEntitlementFormState
  setState: (value: StandardEntitlementFormState) => void
}) => {
  const addActivity = () => {
    const newKey = Math.max(...state.map(({ key }) => key)) + 1
    setState([...state, { key: newKey, value: initialWorkAtOrganizationFormState }])
  }
  return (
    <>
      <h3>Ehrenamtliche Tätigkeit(en)</h3>
      {state.map(({ key, value }, index) => (
        <WorkAtOrganizationForm
          key={key}
          state={value}
          onDelete={state.length <= 1 ? undefined : () => setState(removeAt(state, index))}
          setState={value => setState(replaceAt(state, index, { key, value }))}
        />
      ))}
      {state.length < 10 ? (
        <Button onClick={addActivity}>Weitere Tätigkeit hinzufügen</Button>
      ) : (
        <Alert severity='info'>Maximale Anzahl an Tätigkeiten erreicht.</Alert>
      )}
    </>
  )
}

function replaceAt<T>(array: T[], index: number, newItem: T): T[] {
  const newArray = [...array]
  newArray[index] = newItem
  return newArray
}

function removeAt<T>(array: T[], index: number): T[] {
  const newArray = [...array]
  newArray.splice(index, 1)
  return newArray
}
