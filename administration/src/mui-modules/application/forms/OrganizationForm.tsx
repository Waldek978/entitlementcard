import { Alert, Typography, styled } from '@mui/material'
import React from 'react'

import { OrganizationInput } from '../../../generated/graphql'
import { normalizeName } from '../../../util/normalizeString'
import { useUpdateStateCallback } from '../hooks/useUpdateStateCallback'
import CheckboxForm from '../primitive-inputs/CheckboxForm'
import EmailForm from '../primitive-inputs/EmailForm'
import SelectForm from '../primitive-inputs/SelectForm'
import ShortTextForm from '../primitive-inputs/ShortTextForm'
import { Form, FormComponentProps } from '../util/FormType'
import {
  CompoundState,
  createCompoundGetArrayBufferKeys,
  createCompoundInitialState,
  createCompoundValidate,
} from '../util/compoundFormUtils'
import AddressForm from './AddressForm'

const WarningContactPersonSamePerson = styled(Alert)`
  margin: 8px 0;
`

const organizationCategoryOptions = {
  items: [
    'Soziales/Jugend/Senioren',
    'Tierschutz',
    'Sport',
    'Bildung',
    'Umwelt-/Naturschutz',
    'Kultur',
    'Gesundheit',
    'Katastrophenschutz/Feuerwehr/Rettungsdienst',
    'Kirchen',
    'Andere',
  ].map(item => ({ label: item, value: item })),
}

const contactHasGivenPermissionOptions = {
  required: true,
  notCheckedErrorMessage: 'Die Kontaktperson muss zugestimmt haben, damit Sie Ihren Antrag senden können.',
} as const

const SubForms = {
  name: ShortTextForm,
  address: AddressForm,
  category: SelectForm,
  contactName: ShortTextForm,
  contactEmail: EmailForm,
  contactPhone: ShortTextForm,
  contactHasGivenPermission: CheckboxForm,
}

const getValidatedCompoundInput = createCompoundValidate(SubForms, {
  contactHasGivenPermission: contactHasGivenPermissionOptions,
  category: organizationCategoryOptions,
})

type State = CompoundState<typeof SubForms>
type ValidatedInput = OrganizationInput
type Options = {}
type AdditionalProps = { applicantName: string }
const OrganizationForm: Form<State, Options, ValidatedInput, AdditionalProps> = {
  initialState: createCompoundInitialState(SubForms),
  getArrayBufferKeys: createCompoundGetArrayBufferKeys(SubForms),
  validate: state => {
    const compoundResult = getValidatedCompoundInput(state)
    if (compoundResult.type === 'error') {
      return compoundResult
    }
    return {
      type: 'valid',
      value: {
        name: compoundResult.value.name,
        category: compoundResult.value.category,
        address: compoundResult.value.address,
        contact: {
          name: compoundResult.value.contactName,
          email: compoundResult.value.contactEmail,
          telephone: compoundResult.value.contactPhone,
          hasGivenPermission: compoundResult.value.contactHasGivenPermission,
        },
      },
    }
  },
  Component: ({ state, setState, applicantName }: FormComponentProps<State, AdditionalProps, Options>) => (
    <>
      <h4>Angaben zur Organisation</h4>
      <ShortTextForm.Component
        state={state.name}
        setState={useUpdateStateCallback(setState, 'name')}
        label='Name der Organisation bzw. des Vereins'
      />
      <AddressForm.Component state={state.address} setState={useUpdateStateCallback(setState, 'address')} />
      <SelectForm.Component
        state={state.category}
        setState={useUpdateStateCallback(setState, 'category')}
        label='Einsatzgebiet'
        options={organizationCategoryOptions}
      />
      <h4>Kontaktperson in der Organisation</h4>
      <Typography>
        Bitte geben Sie hier die Daten der Person an, die ihr ehrenamtliches Engagement bestätigen kann.
      </Typography>
      {normalizeName(applicantName) === normalizeName(state.contactName.shortText) && (
        <WarningContactPersonSamePerson severity='warning'>
          Die Kontaktperson der Organisation und die antragsstellende Person scheinen identisch zu sein. Bitte beachten
          Sie, dass Anträge auf dieser Grundlage nicht bewilligt werden können.
        </WarningContactPersonSamePerson>
      )}
      <ShortTextForm.Component
        state={state.contactName}
        setState={useUpdateStateCallback(setState, 'contactName')}
        label='Vor- und Nachname der Kontaktperson in der Organisation'
      />
      <EmailForm.Component
        state={state.contactEmail}
        setState={useUpdateStateCallback(setState, 'contactEmail')}
        label='E-Mail-Adresse'
      />
      <ShortTextForm.Component
        state={state.contactPhone}
        setState={useUpdateStateCallback(setState, 'contactPhone')}
        label='Telefon'
      />
      <CheckboxForm.Component
        state={state.contactHasGivenPermission}
        setState={useUpdateStateCallback(setState, 'contactHasGivenPermission')}
        label='Die Kontaktperson hat der Weitergabe ihrer Daten zum Zwecke der Antragsverarbeitung zugestimmt und darf zur Überprüfung kontaktiert werden.'
        options={contactHasGivenPermissionOptions}
      />
    </>
  ),
}

export default OrganizationForm
