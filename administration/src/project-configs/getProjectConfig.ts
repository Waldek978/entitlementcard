import {
  BAYERN_PRODUCTION_ID,
  BAYERN_STAGING_ID,
  KOBLENZ_PRODUCTION_ID,
  KOBLENZ_STAGING_ID,
  NUERNBERG_PRODUCTION_ID,
  NUERNBERG_STAGING_ID,
} from 'build-configs/constants'
import { ReactElement, ReactNode } from 'react'

import { JsonField } from '../bp-modules/applications/JsonFieldView'
import { ActivityLog } from '../bp-modules/user-settings/ActivityLog'
import CardBlueprint from '../cards/CardBlueprint'
import { CreateCardsResult } from '../cards/createCards'
import { ExtensionClass } from '../cards/extensions/extensions'
import { PdfFormElementProps } from '../cards/pdf/PdfFormElement'
import { PdfLinkAreaProps } from '../cards/pdf/PdfLinkArea'
import { PdfQrCodeElementProps } from '../cards/pdf/PdfQrCodeElement'
import { PdfTextElementProps } from '../cards/pdf/PdfTextElement'
import bayernConfig from './bayern/config'
import { LOCAL_STORAGE_PROJECT_KEY } from './constants'
import koblenzConfig from './koblenz/config'
import nuernbergConfig from './nuernberg/config'
import showcaseConfig from './showcase/config'

export interface PdfConfig {
  title: string
  templatePath: string | null
  issuer: string
  elements?: {
    staticVerificationQrCodes?: PdfQrCodeElementProps[]
    dynamicActivationQrCodes: PdfQrCodeElementProps[]
    text: PdfTextElementProps[]
    form?: PdfFormElementProps[]
    deepLinkArea?: PdfLinkAreaProps
  }
}

export interface ActivityLogConfig {
  columnNames: string[]
  renderLogEntry: (logEntry: ActivityLog) => ReactNode
}

export interface CardConfig {
  nameColumnName: string
  expiryColumnName: string
  extensionColumnNames: (string | null)[]
  defaultValidity: Duration
  extensions: ExtensionClass[]
}

export interface ApplicationFeature {
  applicationJsonToPersonalData: (json: JsonField<'Array'>) => { forenames?: string; surname?: string } | null
  applicationJsonToCardQuery: (json: JsonField<'Array'>) => string | null
}

export type CsvExport =
  | {
      enabled: true
      csvHeader: string[]
      buildCsvLine: (createCardsResult: CreateCardsResult, cardBlueprint: CardBlueprint) => string
    }
  | {
      enabled: false
    }

export type StatisticsTheme = {
  primaryColor: string
  primaryColorLight: string
}

export type CardStatistics =
  | {
      enabled: true
      theme: StatisticsTheme
    }
  | {
      enabled: false
    }
export type StoreFieldConfig = {
  name: string
  isMandatory: boolean
  isValid: (value: string) => boolean
  columnWidth: number
}

export type StoresManagement =
  | {
      enabled: true
      fields: StoreFieldConfig[]
    }
  | {
      enabled: false
    }

export interface ProjectConfig {
  name: string
  projectId: string
  applicationFeature?: ApplicationFeature
  staticQrCodesEnabled: boolean
  card: CardConfig
  dataPrivacyHeadline: string
  dataPrivacyContent: () => ReactElement
  dataPrivacyAdditionalBaseContent?: () => ReactElement
  pdf: PdfConfig
  timezone: string
  activityLogConfig?: ActivityLogConfig
  activation?: {
    activationText: (applicationName: string, downloadLink: string, deepLink: string) => ReactElement
    downloadLink: string
  }
  csvExport: CsvExport
  cardStatistics: CardStatistics
  freinetCSVImportEnabled: boolean
  cardCreation: boolean
  storeManagement: StoresManagement
}

export const setProjectConfigOverride = (hostname: string) => {
  window.localStorage.setItem(LOCAL_STORAGE_PROJECT_KEY, hostname)
}

const getProjectConfig = (hostname: string): ProjectConfig => {
  switch (window.localStorage.getItem(LOCAL_STORAGE_PROJECT_KEY) ?? hostname) {
    case BAYERN_PRODUCTION_ID:
    case BAYERN_STAGING_ID:
      return bayernConfig
    case NUERNBERG_PRODUCTION_ID:
    case NUERNBERG_STAGING_ID:
      return nuernbergConfig
    case KOBLENZ_PRODUCTION_ID:
    case KOBLENZ_STAGING_ID:
      return koblenzConfig
    default:
      console.debug('Falling back to showcase.')
      return showcaseConfig
  }
}

export default getProjectConfig
