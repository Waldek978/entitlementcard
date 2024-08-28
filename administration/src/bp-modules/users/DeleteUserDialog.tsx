import { Button, Callout, Checkbox, Classes, Dialog } from '@blueprintjs/core'
import React, { ReactElement, useContext } from 'react'

import { AuthContext } from '../../AuthProvider'
import { WhoAmIContext } from '../../WhoAmIProvider'
import getMessageFromApolloError from '../../errors/getMessageFromApolloError'
import { Administrator, useDeleteAdministratorMutation } from '../../generated/graphql'
import { ProjectConfigContext } from '../../project-configs/ProjectConfigContext'
import { useAppToaster } from '../AppToaster'

const DeleteUserDialog = ({
  selectedUser,
  onClose,
  onSuccess,
}: {
  onClose: () => void
  selectedUser: Administrator | null
  onSuccess: () => void
}): ReactElement => {
  const appToaster = useAppToaster()
  const { signOut } = useContext(AuthContext)
  const actingAdminId = useContext(WhoAmIContext).me?.id
  const { projectId: project } = useContext(ProjectConfigContext)

  const [deleteAdministrator, { loading }] = useDeleteAdministratorMutation({
    onError: error => {
      const { title } = getMessageFromApolloError(error)
      appToaster?.show({ intent: 'danger', message: title })
    },
    onCompleted: () => {
      appToaster?.show({ intent: 'success', message: 'Benutzer erfolgreich gelöscht.' })
      if (selectedUser?.id === actingAdminId) {
        signOut()
      } else {
        onClose()
        onSuccess()
      }
    },
  })

  return (
    <Dialog title={`Benutzer '${selectedUser?.email}' löschen?`} isOpen={selectedUser !== null} onClose={onClose}>
      <form
        onSubmit={e => {
          e.preventDefault()

          if (selectedUser === null) {
            console.error('Form submitted in an unexpected state.')
            return
          }

          deleteAdministrator({
            variables: {
              project,
              adminId: selectedUser.id,
            },
          })
        }}>
        <div className={Classes.DIALOG_BODY}>
          Möchten Sie den Benutzer '{selectedUser?.email}' unwiderruflich löschen?
          {selectedUser?.id !== actingAdminId ? null : (
            <Callout intent='danger' style={{ marginTop: '16px' }}>
              <b>Sie löschen Ihr eigenes Konto.</b> Sie werden ausgeloggt und können sich nicht mehr einloggen.
              <Checkbox required>Ich bestätige, dass ich diesen Warnhinweis gelesen habe.</Checkbox>
            </Callout>
          )}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button type='submit' intent='danger' text='Benutzer löschen' icon='trash' loading={loading} />
          </div>
        </div>
      </form>
    </Dialog>
  )
}

export default DeleteUserDialog
