import BirthdayExtension from '../../cards/extensions/BirthdayExtension'
import KoblenzReferenceNumberExtension from '../../cards/extensions/KoblenzReferenceNumberExtension'
import { ProjectConfig } from '../getProjectConfig'
import { ActivationText } from './activationText'
import { DataPrivacyBaseText, dataPrivacyBaseHeadline } from './dataPrivacyBase'
import pdfConfig from './pdf'

const config: ProjectConfig = {
  name: 'KoblenzPass',
  projectId: 'koblenz.sozialpass.app',
  staticQrCodesEnabled: true,
  card: {
    nameColumnName: 'Name',
    expiryColumnName: 'Ablaufdatum',
    extensionColumnNames: ['Geburtsdatum', 'Referenznummer'],
    defaultValidity: { years: 1 },
    extensions: [BirthdayExtension, KoblenzReferenceNumberExtension],
  },
  dataPrivacyHeadline: dataPrivacyBaseHeadline,
  dataPrivacyContent: DataPrivacyBaseText,
  timezone: 'Europe/Berlin',
  pdf: pdfConfig,
  csvExport: {
    enabled: false,
  },
  activation: {
    activationText: ActivationText,
    downloadLink: 'https://download.koblenz.sozialpass.app/',
  },
  cardStatistics: { enabled: false },
  freinetCSVImportEnabled: false,
  cardCreation: true,
  selfServiceEnabled: true,
  storeManagement: {
    enabled: false,
  },
  userImportApiEnabled: true,
}

export default config
