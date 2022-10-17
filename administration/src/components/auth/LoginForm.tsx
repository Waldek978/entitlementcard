import React, { ChangeEvent } from 'react'
import { Button, Classes, FormGroup, InputGroup } from '@blueprintjs/core'
import PasswordInput from '../PasswordInput'

interface Props {
  loading?: boolean
  email: string
  password: string
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  onSubmit: () => void
}

const LoginForm = (props: Props) => {
  return (
    <div style={{ marginTop: '20px' }}>
      <form
        onSubmit={event => {
          event.preventDefault()
          props.onSubmit()
        }}>
        <FormGroup label='E-Mail'>
          <InputGroup
            placeholder='erika.musterfrau@example.org'
            autoFocus
            value={props.email}
            disabled={!!props.loading}
            onChange={(event: ChangeEvent<HTMLInputElement>) => props.setEmail(event.target.value)}
          />
        </FormGroup>
        <FormGroup label='Passwort'>
          <PasswordInput
            placeholder='Passwort'
            value={props.password}
            disabled={!!props.loading}
            setValue={props.setPassword}
            label=''
          />
        </FormGroup>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button text='Anmelden' type='submit' intent='primary' loading={!!props.loading} />
        </div>
      </form>
    </div>
  )
}

export default LoginForm
