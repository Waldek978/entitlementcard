import { Button, Card, Classes, FormGroup, H2, H3, H4, InputGroup } from '@blueprintjs/core'
import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProjectConfigContext } from '../../project-configs/ProjectConfigContext'
import StandaloneCenter from '../StandaloneCenter'
import { useAppToaster } from '../AppToaster'
import { useSendResetMailMutation } from '../../generated/graphql'

const ForgotPasswordController = () => {
  const config = useContext(ProjectConfigContext)
  const appToaster = useAppToaster()
  const [finished, setFinished] = useState(false)
  const [email, setEmail] = useState('')

  const [sendResetMail, { loading }] = useSendResetMailMutation({
    onCompleted: () => setFinished(true),
    onError: () =>
      appToaster?.show({
        intent: 'danger',
        message: 'Etwas ist schief gelaufen. Prüfen Sie Ihre Eingaben.',
      }),
  })

  const submit = () =>
    sendResetMail({
      variables: {
        project: config.projectId,
        email,
      },
    })

  return (
    <StandaloneCenter>
      <Card style={{ width: '100%', maxWidth: '500px' }}>
        <H2>{config.name}</H2>
        <H3>Verwaltung</H3>
        <H4>Passwort vergessen</H4>
        {finished ? (
          <>
            <p>
              Wir haben eine E-Mail an {email} gesendet. Darin finden Sie einen Link, mit dem Sie Ihr Passwort
              zurücksetzen können.
            </p>
            <p>Bitte prüfen Sie Ihren Spam-Ordner.</p>
            <p>
              <Link to={'/'}>Zum Login</Link>
            </p>
          </>
        ) : (
          <>
            <p>Falls Sie Ihr Passwort vergessen haben, können Sie es hier zurücksetzen.</p>
            <form
              onSubmit={e => {
                e.preventDefault()
                submit()
              }}>
              <FormGroup label='Email-Adresse'>
                <InputGroup
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  type='email'
                  placeholder='erika.musterfrau@example.org'
                />
              </FormGroup>
              <div
                className={Classes.DIALOG_FOOTER_ACTIONS}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to='/'>Zurück zum Login</Link>
                <Button
                  type='submit'
                  intent='primary'
                  text='Passwort zurücksetzen'
                  loading={loading}
                  disabled={email === ''}
                />
              </div>
            </form>
          </>
        )}
      </Card>
    </StandaloneCenter>
  )
}

export default ForgotPasswordController
