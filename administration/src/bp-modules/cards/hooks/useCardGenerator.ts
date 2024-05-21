import { useApolloClient } from '@apollo/client'
import { useCallback, useContext, useState } from 'react'

import { CardBlueprint } from '../../../cards/CardBlueprint'
import { CsvError, generateCsv, getCSVFilename } from '../../../cards/CsvFactory'
import { PdfError, generatePdf } from '../../../cards/PdfFactory'
import createCards, { CreateCardsError, CreateCardsResult } from '../../../cards/createCards'
import deleteCards from '../../../cards/deleteCards'
import EMailNotificationExtension from '../../../cards/extensions/EMailNotificationExtension'
import { findExtension } from '../../../cards/extensions/extensions'
import getMessageFromApolloError from '../../../errors/getMessageFromApolloError'
import { Region, useSendCardCreationConfirmationMailMutation } from '../../../generated/graphql'
import { ProjectConfigContext } from '../../../project-configs/ProjectConfigContext'
import downloadDataUri from '../../../util/downloadDataUri'
import getDeepLinkFromQrCode from '../../../util/getDeepLinkFromQrCode'
import { useAppToaster } from '../../AppToaster'
import { ActivityLog } from '../../user-settings/ActivityLog'

export enum CardActivationState {
  input,
  loading,
  finished,
}

const extractCardInfoHashes = (codes: CreateCardsResult[]) => {
  return codes.flatMap(code => {
    if (code.staticCardInfoHashBase64) {
      return [code.dynamicCardInfoHashBase64, code.staticCardInfoHashBase64]
    }
    return code.dynamicCardInfoHashBase64
  })
}

const useCardGenerator = (region: Region) => {
  const projectConfig = useContext(ProjectConfigContext)
  const [sendMail] = useSendCardCreationConfirmationMailMutation({
    onCompleted: () => {
      appToaster?.show({ intent: 'success', message: 'Bestätigungsmail wurde versendet.' })
    },
    onError: error => {
      const { title } = getMessageFromApolloError(error)
      appToaster?.show({
        intent: 'danger',
        message: title,
        timeout: 0,
      })
    },
  })
  const [cardBlueprints, setCardBlueprints] = useState<CardBlueprint[]>([])
  const [state, setState] = useState(CardActivationState.input)
  const [applicationId, setApplicationId] = useState<number>()
  const client = useApolloClient()
  const appToaster = useAppToaster()

  const sendCardConfirmationMails = async (
    codes: CreateCardsResult[],
    cardBlueprints: CardBlueprint[],
    projectId: string
  ): Promise<void> => {
    for (let k = 0; k < codes.length; k++) {
      const cardBlueprint = cardBlueprints[k]
      const mailNotificationExtension = findExtension(cardBlueprint.extensions, EMailNotificationExtension)
      if (!mailNotificationExtension?.state) {
        return
      }
      const dynamicCode = codes[k].dynamicActivationCode
      const deepLink = getDeepLinkFromQrCode({
        case: 'dynamicActivationCode',
        value: dynamicCode,
      })
      await sendMail({
        variables: {
          project: projectId,
          recipientAddress: mailNotificationExtension.state,
          recipientName: cardBlueprint.fullName,
          deepLink,
        },
      })
    }
  }

  const handleError = useCallback(
    async (error: unknown, codes: CreateCardsResult[] | undefined) => {
      if (codes !== undefined) {
        // try rollback
        try {
          await deleteCards(client, region.id, extractCardInfoHashes(codes))
        } catch {}
      }
      if (error instanceof CreateCardsError) {
        appToaster?.show({
          message: error.message,
          intent: 'danger',
        })
      } else if (error instanceof PdfError) {
        appToaster?.show({
          message: 'Etwas ist schiefgegangen beim Erstellen der PDF.',
          intent: 'danger',
        })
      } else if (error instanceof CsvError) {
        appToaster?.show({
          message: 'Etwas ist schiefgegangen beim Erstellen der CSV.',
          intent: 'danger',
        })
      } else {
        appToaster?.show({
          message: 'Unbekannter Fehler: Etwas ist schiefgegangen.',
          intent: 'danger',
        })
      }
      setState(CardActivationState.input)
    },
    [appToaster, client, region]
  )

  const generateCards = useCallback(
    async (
      generateFunction: (codes: CreateCardsResult[], cardBlueprints: CardBlueprint[]) => Promise<Blob> | Blob,
      filename: string,
      applicationId?: number
    ) => {
      let codes: CreateCardsResult[] | undefined
      setState(CardActivationState.loading)

      try {
        const cardInfos = cardBlueprints.map(card => card.generateCardInfo())
        codes = await createCards(
          client,
          projectConfig.projectId,
          cardInfos,
          projectConfig.staticQrCodesEnabled,
          applicationId
        )

        const dataUri = await generateFunction(codes, cardBlueprints)

        cardBlueprints.forEach(cardBlueprint => new ActivityLog(cardBlueprint).saveToSessionStorage())

        downloadDataUri(dataUri, filename)
        if (projectConfig.cardCreationConfirmationMailEnabled) {
          await sendCardConfirmationMails(codes, cardBlueprints, projectConfig.projectId)
        }
        setState(CardActivationState.finished)
      } catch (error) {
        handleError(error, codes)
      } finally {
        setCardBlueprints([])
      }
    },
    [cardBlueprints, client, projectConfig, handleError, sendCardConfirmationMails, projectConfig.csvExport]
  )

  const generateCardsPdf = useCallback(
    async (applicationId?: number) => {
      generateCards(
        (codes: CreateCardsResult[], cardBlueprints: CardBlueprint[]) =>
          generatePdf(codes, cardBlueprints, region, projectConfig.pdf),
        'berechtigungskarten.pdf',
        applicationId
      )
    },
    [projectConfig, region, generateCards]
  )

  const generateCardsCsv = useCallback(
    async (applicationId?: number) => {
      generateCards(
        (codes: CreateCardsResult[], cardBlueprints: CardBlueprint[]) =>
          generateCsv(codes, cardBlueprints, projectConfig.csvExport),
        getCSVFilename(cardBlueprints),
        applicationId
      )
    },
    [cardBlueprints, generateCards]
  )

  return {
    state,
    setState,
    generateCardsPdf,
    generateCardsCsv,
    setCardBlueprints,
    cardBlueprints,
    setApplicationId,
    applicationId,
  }
}

export default useCardGenerator
