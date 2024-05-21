import { NonIdealState, Spinner } from '@blueprintjs/core'
import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'

import { WhoAmIContext } from '../../WhoAmIProvider'
import { Region } from '../../generated/graphql'
import useBlockNavigation from '../../util/useBlockNavigation'
import AddCardsForm from './AddCardsForm'
import GenerationFinished from './CardsCreatedMessage'
import CreateCardsButtonBar from './CreateCardsButtonBar'
import useCardGenerator, { CardActivationState } from './hooks/useCardGenerator'

const AddCardsController = () => {
  const { region } = useContext(WhoAmIContext).me!
  if (!region) {
    return (
      <NonIdealState
        icon='cross'
        title='Fehlende Berechtigung'
        description='Sie sind nicht berechtigt, Karten auszustellen.'
      />
    )
  }

  return <InnerAddCardsController region={region} />
}

const InnerAddCardsController = ({ region }: { region: Region }) => {
  const navigate = useNavigate()
  const {
    state,
    setState,
    generateCardsPdf,
    generateCardsCsv,
    setCardBlueprints,
    cardBlueprints,
    applicationId,
    setApplicationId,
  } = useCardGenerator(region)

  useBlockNavigation({
    when: cardBlueprints.length > 0,
    message: 'Falls Sie fortfahren, werden alle Eingaben verworfen.',
  })

  if (state === CardActivationState.loading) return <Spinner />
  if (state === CardActivationState.finished)
    return (
      <GenerationFinished
        reset={() => {
          setCardBlueprints([])
          setState(CardActivationState.input)
        }}
      />
    )

  return (
    <>
      <AddCardsForm
        region={region}
        cardBlueprints={cardBlueprints}
        setCardBlueprints={setCardBlueprints}
        setApplicationId={setApplicationId}
      />
      <CreateCardsButtonBar
        cardBlueprints={cardBlueprints}
        goBack={() => navigate('/cards')}
        generateCardsPdf={() => generateCardsPdf(applicationId)}
        generateCardsCsv={() => generateCardsCsv(applicationId)}
      />
    </>
  )
}

export default AddCardsController
