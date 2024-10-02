import { MockedProvider as ApolloProvider } from '@apollo/client/testing'
import { OverlayToaster } from '@blueprintjs/core'
import { act, renderHook } from '@testing-library/react'
import { mocked } from 'jest-mock'
import React, { ReactElement } from 'react'

import CardBlueprint from '../../../cards/CardBlueprint'
import { PdfError, generatePdf } from '../../../cards/PdfFactory'
import createCards, { CreateCardsError, CreateCardsResult } from '../../../cards/createCards'
import deleteCards from '../../../cards/deleteCards'
import { DynamicActivationCode, StaticVerificationCode } from '../../../generated/card_pb'
import { Region } from '../../../generated/graphql'
import { ProjectConfigProvider } from '../../../project-configs/ProjectConfigContext'
import bayernConfig from '../../../project-configs/bayern/config'
import downloadDataUri from '../../../util/downloadDataUri'
import { AppToasterProvider } from '../../AppToaster'
import useCardGenerator, { CardActivationState } from './useCardGenerator'

const wrapper = ({ children }: { children: ReactElement }) => (
  <AppToasterProvider>
    <ApolloProvider>
      <ProjectConfigProvider>{children}</ProjectConfigProvider>
    </ApolloProvider>
  </AppToasterProvider>
)

jest.mock('../../../cards/PdfFactory', () => ({
  ...jest.requireActual('../../../cards/PdfFactory'),
  generatePdf: jest.fn(),
}))
jest.mock('../../../cards/createCards', () => ({
  ...jest.requireActual('../../../cards/createCards'),
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('../../../cards/deleteCards')
jest.mock('../../../util/downloadDataUri')

describe('useCardGenerator', () => {
  const region: Region = {
    id: 0,
    name: 'augsburg',
    prefix: 'a',
    activatedForApplication: true,
    activatedForCardConfirmationMail: true,
  }

  const cards = [
    new CardBlueprint('Thea Test', bayernConfig.card, [region]),
    new CardBlueprint('Thea Test', bayernConfig.card, [region]),
  ]
  const codes: CreateCardsResult[] = [
    {
      dynamicCardInfoHashBase64: 'rS8nukf7S9j8V1j+PZEkBQWlAeM2WUKkmxBHi1k9hRo=',
      dynamicActivationCode: new DynamicActivationCode({ info: cards[0].generateCardInfo() }),
    },
    {
      dynamicCardInfoHashBase64: 'rS8nukf7S9j8V1j+PZEkBQWlAeM2WUKkmxBHi1k9hRo=',
      dynamicActivationCode: new DynamicActivationCode({ info: cards[1].generateCardInfo() }),
      staticCardInfoHashBase64: 'rS8nukf7S9j8V1j+PZEkBQWlAeM2WUKkmxBHi1k9hRo=',
      staticVerificationCode: new StaticVerificationCode({ info: cards[1].generateCardInfo() }),
    },
  ]

  it('should successfully create multiple cards', async () => {
    const toasterSpy = jest.spyOn(OverlayToaster.prototype, 'show')
    mocked(createCards).mockReturnValueOnce(Promise.resolve(codes))
    const { result } = renderHook(() => useCardGenerator(region), { wrapper })

    act(() => result.current.setCardBlueprints(cards))

    expect(result.current.cardBlueprints).toEqual(cards)
    await act(async () => {
      await result.current.generateCardsPdf()
    })

    expect(toasterSpy).not.toHaveBeenCalled()
    expect(createCards).toHaveBeenCalled()
    expect(downloadDataUri).toHaveBeenCalled()
    expect(result.current.state).toBe(CardActivationState.finished)
    expect(result.current.cardBlueprints).toEqual([])
  })

  it('should show error message for failed card generation', async () => {
    const toasterSpy = jest.spyOn(OverlayToaster.prototype, 'show')
    mocked(createCards).mockImplementation(() => {
      throw new CreateCardsError('error')
    })

    const { result } = renderHook(() => useCardGenerator(region), { wrapper })

    act(() => result.current.setCardBlueprints(cards))

    expect(result.current.cardBlueprints).toEqual(cards)
    await act(async () => {
      await result.current.generateCardsPdf()
    })

    expect(toasterSpy).toHaveBeenCalledWith({ message: 'error', intent: 'danger' })
    expect(downloadDataUri).not.toHaveBeenCalled()
    expect(result.current.state).toBe(CardActivationState.input)
    expect(result.current.cardBlueprints).toEqual([])
  })

  it('should show error message and run rollback for failed pdf generation', async () => {
    mocked(createCards).mockReturnValueOnce(Promise.resolve(codes))
    mocked(deleteCards).mockReturnValueOnce(Promise.resolve())
    mocked(generatePdf).mockImplementationOnce(() => {
      throw new PdfError('error')
    })
    const toasterSpy = jest.spyOn(OverlayToaster.prototype, 'show')

    const { result } = renderHook(() => useCardGenerator(region), { wrapper })

    act(() => result.current.setCardBlueprints(cards))

    expect(result.current.cardBlueprints).toEqual(cards)
    await act(async () => {
      await result.current.generateCardsPdf()
    })

    const codesToDelete = [
      codes[0].dynamicCardInfoHashBase64,
      codes[1].staticCardInfoHashBase64,
      codes[1].dynamicCardInfoHashBase64,
    ]

    expect(toasterSpy).toHaveBeenCalledWith(expect.objectContaining({ intent: 'danger' }))
    expect(deleteCards).toHaveBeenCalledWith(expect.anything(), region.id, codesToDelete)
    expect(downloadDataUri).not.toHaveBeenCalled()
    expect(result.current.state).toBe(CardActivationState.input)
    expect(result.current.cardBlueprints).toEqual([])
  })
})
