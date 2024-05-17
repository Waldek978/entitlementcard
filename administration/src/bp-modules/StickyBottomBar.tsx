import { Card } from '@blueprintjs/core'
import styled from 'styled-components'

const StickyBottomBar = styled(Card)`
  position: fixed;
  bottom: 0;
  width: 100%;
  padding: 8px;
  background: #fafafa;
  z-index: 10;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  & button {
    margin: 5px;
  }
`

export default StickyBottomBar
