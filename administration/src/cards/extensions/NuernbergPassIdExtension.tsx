import { FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import { PartialMessage } from '@bufbuild/protobuf'

import { CardExtensions, NuernergPassIdentifier } from '../../generated/card_pb'
import { Extension } from './extensions'

type NuernbergPassIdState = { passId: number }

const nuernbergPassIdLength = 10
class NuernbergPassIdExtension extends Extension<NuernbergPassIdState, null> {
  public readonly name = NuernbergPassIdExtension.name

  setInitialState() {}
  createForm(onUpdate: () => void) {
    return (
      <FormGroup
        label='Nürnberg-Pass-ID'
        labelFor='nuernberg-pass-id-input'
        intent={this.isValid() ? undefined : Intent.DANGER}>
        <InputGroup
          id='nuernberg-pass-id-input'
          placeholder='12345678'
          intent={this.isValid() ? undefined : Intent.DANGER}
          value={this.state?.passId.toString() ?? ''}
          maxLength={nuernbergPassIdLength}
          onChange={event => {
            const value = event.target.value
            if (value.length > nuernbergPassIdLength) {
              return
            }

            const parsedNumber = Number.parseInt(value)

            if (isNaN(parsedNumber)) {
              this.state = null
              onUpdate()
              return
            }

            this.state = {
              passId: parsedNumber,
            }
            onUpdate()
          }}
        />
      </FormGroup>
    )
  }

  causesInfiniteLifetime() {
    return false
  }
  setProtobufData(message: PartialMessage<CardExtensions>) {
    message.extensionNuernbergPassId = {
      identifier: NuernergPassIdentifier.passId,
      passId: this.state?.passId,
    }
  }

  isValid() {
    return this.state !== null && this.state.passId > 0 && this.state.passId < 10 ** nuernbergPassIdLength
  }

  fromString(state: string) {
    const passId = parseInt(state, 10)
    this.state = !isNaN(passId) ? { passId } : null
  }

  toString() {
    return this.state ? `${this.state.passId}` : ''
  }
}

export default NuernbergPassIdExtension
