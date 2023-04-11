import { HTMLSelect } from '@blueprintjs/core'

import { Role } from '../../generated/graphql'
import { roleToText } from './UsersTable'

const RoleSelector = ({
  role,
  onChange,
  hideProjectAdmin,
}: {
  role: Role | null
  onChange: (role: Role | null) => void
  hideProjectAdmin: boolean
}) => {
  return (
    <HTMLSelect fill onChange={e => onChange((e.target.value as Role | null) ?? null)} value={role ?? ''} required>
      <option value='' disabled>
        Auswählen...
      </option>
      {hideProjectAdmin ? null : <option value={Role.ProjectAdmin}>{roleToText(Role.ProjectAdmin)}</option>}
      <option value={Role.RegionAdmin}>{roleToText(Role.RegionAdmin)}</option>
      <option value={Role.RegionManager}>{roleToText(Role.RegionManager)}</option>
    </HTMLSelect>
  )
}
export default RoleSelector
