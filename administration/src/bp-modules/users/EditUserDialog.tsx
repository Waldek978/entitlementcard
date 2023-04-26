import { Button, Callout, Checkbox, Classes, Dialog, FormGroup, InputGroup } from '@blueprintjs/core'
import { useContext, useEffect, useState } from 'react'
import styled from 'styled-components'

import { WhoAmIContext } from '../../WhoAmIProvider'
import getMessageFromApolloError from '../../errors/getMessageFromApolloError'
import { Administrator, Role, useEditAdministratorMutation } from '../../generated/graphql'
import { ProjectConfigContext } from '../../project-configs/ProjectConfigContext'
import { useAppToaster } from '../AppToaster'
import RegionSelector from './RegionSelector'
import RoleHelpButton from './RoleHelpButton'
import RoleSelector from './RoleSelector'

const RoleFormGroupLabel = styled.span`
  & span {
    display: inline-block !important;
  }
`

const EditUserDialog = ({
  selectedUser,
  onClose,
  onSuccess,
  regionIdOverride,
}: {
  onClose: () => void
  selectedUser: Administrator | null
  onSuccess: () => void
  // If regionIdOverride is set, the region selector will be hidden, and only RegionAdministrator and RegionManager
  // roles are selectable.
  regionIdOverride: number | null
}) => {
  const appToaster = useAppToaster()
  const { me, refetch: refetchMe } = useContext(WhoAmIContext)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role | null>(null)
  const [regionId, setRegionId] = useState<number | null>(null)
  const { projectId: project } = useContext(ProjectConfigContext)
  const rolesWithRegion = [Role.RegionManager, Role.RegionAdmin]

  useEffect(() => {
    if (selectedUser !== null) {
      setEmail(selectedUser.email)
      setRole(selectedUser.role)
      setRegionId(selectedUser.regionId === undefined ? null : selectedUser.regionId)
    }
  }, [selectedUser])

  const [editAdministrator, { loading }] = useEditAdministratorMutation({
    onError: error => {
      const { title } = getMessageFromApolloError(error)
      appToaster?.show({ intent: 'danger', message: title })
    },
    onCompleted: () => {
      appToaster?.show({ intent: 'success', message: 'Benutzer erfolgreich bearbeitet.' })
      onClose()
      if (me?.id === selectedUser?.id) {
        refetchMe()
      } else {
        onSuccess()
      }
    },
  })

  const getRegionId = () => {
    if (regionIdOverride !== null) {
      return regionIdOverride
    } else {
      return role !== null && rolesWithRegion.includes(role) ? regionId : null
    }
  }

  return (
    <Dialog title={`Benutzer '${selectedUser?.email}' bearbeiten`} isOpen={selectedUser !== null} onClose={onClose}>
      <form
        onSubmit={e => {
          e.preventDefault()

          if (selectedUser === null) {
            console.error('Form submitted in an unexpected state.')
            return
          }

          editAdministrator({
            variables: {
              project,
              adminId: selectedUser.id,
              newEmail: email,
              newRole: role as Role,
              newRegionId: getRegionId(),
            },
          })
        }}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label='Email-Adresse'>
            <InputGroup
              value={email}
              required
              onChange={e => setEmail(e.target.value)}
              type='email'
              placeholder='erika.musterfrau@example.org'
            />
          </FormGroup>
          <FormGroup
            label={
              <RoleFormGroupLabel>
                Rolle <RoleHelpButton />
              </RoleFormGroupLabel>
            }>
            <RoleSelector role={role} onChange={setRole} hideProjectAdmin={regionIdOverride !== null} />
          </FormGroup>
          {regionIdOverride !== null || role === null || !rolesWithRegion.includes(role) ? null : (
            <FormGroup label='Region'>
              <RegionSelector onSelect={region => setRegionId(region.id)} selectedId={regionId} />
            </FormGroup>
          )}
          <Callout intent='primary'>
            {selectedUser?.id === me?.id ? (
              <>
                Sie können Ihr eigenes Passwort in den{' '}
                <a href={window.location.origin + '/user-settings'} target='_blank' rel='noreferrer'>
                  Benutzereinstellungen
                </a>{' '}
                ändern.
              </>
            ) : (
              <>
                Der Benutzer kann sein Passwort unter{' '}
                <a href={window.location.origin + '/forgot-password'} target='_blank' rel='noreferrer'>
                  {window.location.origin + '/forgot-password'}
                </a>{' '}
                zurücksetzen.
              </>
            )}
          </Callout>
          {selectedUser?.id !== me?.id ? null : (
            <Callout intent='danger' style={{ marginTop: '16px' }}>
              <b>Sie bearbeiten Ihr eigenes Konto.</b> Möglicherweise können Sie diese Änderungen nicht rückgängig
              machen.
              <Checkbox required>Ich bestätige, dass ich diesen Warnhinweis gelesen habe.</Checkbox>
            </Callout>
          )}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button type='submit' intent='primary' text='Benutzer bearbeiten' icon='edit' loading={loading} />
          </div>
        </div>
      </form>
    </Dialog>
  )
}

export default EditUserDialog
