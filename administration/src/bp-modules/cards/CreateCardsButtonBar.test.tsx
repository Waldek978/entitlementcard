import { act, fireEvent, render } from '@testing-library/react'
import { ReactElement } from 'react'

import CardBlueprint from '../../cards/CardBlueprint'
import { Region } from '../../generated/graphql'
import { ProjectConfigProvider } from '../../project-configs/ProjectConfigContext'
import bayernConfig from '../../project-configs/bayern/config'
import CreateCardsButtonBar from './CreateCardsButtonBar'

jest.useFakeTimers()

const wrapper = ({ children }: { children: ReactElement }) => <ProjectConfigProvider>{children}</ProjectConfigProvider>

describe('CreateCardsButtonBar', () => {
  it('Should goBack when clicking back', async () => {
    const goBack = jest.fn()
    const { getByText } = render(
      <CreateCardsButtonBar goBack={goBack} cardBlueprints={[]} generateCards={() => Promise.resolve()} />,
      { wrapper }
    )

    const backButton = getByText('Zurück zur Auswahl')
    expect(backButton).toBeTruthy()

    fireEvent.click(backButton)
    await act(async () => await null) // Popper update() - https://github.com/popperjs/react-popper/issues/350

    expect(goBack).toHaveBeenCalled()
  })

  it('Should disable generate button for no cards', async () => {
    const generateCards = jest.fn()
    const { getByText } = render(
      <CreateCardsButtonBar goBack={() => {}} cardBlueprints={[]} generateCards={generateCards} />,
      { wrapper }
    )

    const generateButton = getByText('QR-Codes drucken').closest('button') as HTMLButtonElement
    expect(generateButton).toBeTruthy()
    expect(generateButton.disabled).toBeTruthy()

    fireEvent.mouseOver(generateButton)
    fireEvent.click(generateButton)
    await act(async () => {
      jest.advanceTimersByTime(100)
    })

    expect(getByText('Legen Sie zunächst eine Karte an.')).toBeTruthy()
    expect(generateCards).not.toHaveBeenCalled()
  })

  it('Should disable generate button for invalid cards', async () => {
    const generateCards = jest.fn()
    const cards = [new CardBlueprint('Thea Test', bayernConfig.card)]
    const { getByText } = render(
      <CreateCardsButtonBar goBack={() => {}} cardBlueprints={cards} generateCards={generateCards} />,
      { wrapper }
    )

    const generateButton = getByText('QR-Codes drucken').closest('button') as HTMLButtonElement
    expect(generateButton).toBeTruthy()

    fireEvent.mouseOver(generateButton)
    fireEvent.click(generateButton)

    await act(async () => {
      jest.advanceTimersByTime(100)
    })

    expect(generateButton.disabled).toBeTruthy()
    expect(getByText('Mindestens eine Karte enthält ungültige Eingaben.')).toBeTruthy()
    expect(generateCards).not.toHaveBeenCalled()
  })

  it('Should generate valid cards', async () => {
    const generateCards = jest.fn()
    const region: Region = {
      id: 0,
      name: 'augsburg',
      prefix: 'a',
      activatedForApplication: true,
      activatedForCardConfirmationMail: true,
    }
    const cards = [new CardBlueprint('Thea Test', bayernConfig.card, [region])]
    const { getByText } = render(
      <CreateCardsButtonBar goBack={() => {}} cardBlueprints={cards} generateCards={generateCards} />,
      { wrapper }
    )

    const generateButton = getByText('QR-Codes drucken').closest('button') as HTMLButtonElement
    expect(generateButton).toBeTruthy()

    fireEvent.click(generateButton)
    await act(async () => await null) // Popper update() - https://github.com/popperjs/react-popper/issues/350

    expect(generateCards).toHaveBeenCalled()
  })
})
