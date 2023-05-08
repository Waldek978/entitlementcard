import { Button, Card, Dialog, DialogBody, H2 } from '@blueprintjs/core'
import React, { ReactElement, useState } from 'react'
import styled from 'styled-components'

import { ActivityLogConfig } from '../../project-configs/getProjectConfig'
import { loadActivityLog } from './ActivityLog'

const ActivityDialog = styled(Dialog)`
  max-height: 800px;
  min-width: 800px;
`

const ActivityDialogBody = styled(DialogBody)`
  padding: 0;
  overflow-x: hidden;
`

const StickyTableHeader = styled.thead`
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  z-index: 2;
`

const EmptyLog = styled.div`
  margin: 12px;
`

const StyledTable = styled.table`
  border-spacing: 0;
  min-width: 800px;
  overflow-x: hidden;

  & tbody tr:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  & td,
  & th {
    margin: 0;
    padding: 16px;
    text-align: center;
  }

  & th {
    position: sticky;
    top: 0;
    background: white;
    border-top: 1px solid lightgray;
    border-bottom: 1px solid lightgray;
  }
`
const ActivityLogCard = ({ activityLogConfig }: { activityLogConfig: ActivityLogConfig }): ReactElement => {
  const [openLog, setOpenLog] = useState<boolean>(false)
  const activityLogSorted = loadActivityLog().sort((a, b) => (new Date(a.timestamp) < new Date(b.timestamp) ? 1 : -1))

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <Card style={{ width: '500px' }}>
          <H2>Aktivitätsprotokoll</H2>
          <p>Hier können sie den Verlauf ihrer Aktivitäten einsehen.</p>
          <div style={{ textAlign: 'right', padding: '10px 0' }}>
            <Button text='Aktivitäten ansehen' intent='primary' onClick={() => setOpenLog(true)} />
          </div>
        </Card>
      </div>
      <ActivityDialog
        isOpen={openLog}
        title='Aktivitätsprotokoll'
        onClose={() => setOpenLog(false)}
        isCloseButtonShown={true}>
        <ActivityDialogBody>
          <StyledTable>
            <StickyTableHeader>
              <tr>
                {activityLogConfig.columnNames.map(columnName => (
                  <th>{columnName}</th>
                ))}
              </tr>
            </StickyTableHeader>
            <tbody>
              {activityLogSorted.length > 0 ? (
                activityLogSorted.map(logEntry => activityLogConfig.renderLogEntry(logEntry))
              ) : (
                <EmptyLog>Keine Einträge vorhanden</EmptyLog>
              )}
            </tbody>
          </StyledTable>
        </ActivityDialogBody>
      </ActivityDialog>
    </>
  )
}

export default ActivityLogCard
