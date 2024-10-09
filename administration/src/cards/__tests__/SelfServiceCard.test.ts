import SelfServiceCard from '../SelfServiceCard'
import BirthdayExtension from '../extensions/BirthdayExtension'
import KoblenzReferenceNumberExtension from '../extensions/KoblenzReferenceNumberExtension'

describe('SelfServiceCArd', () => {
  const cardConfig = {
    defaultValidity: { years: 3 },
    nameColumnName: 'Name',
    expiryColumnName: 'Ablaufdatum',
    extensionColumnNames: ['Geburtsdatum', 'Referenznummer'],
    extensions: [BirthdayExtension, KoblenzReferenceNumberExtension],
  }

  it('should correctly initialize CardBlueprint', () => {
    const card = new SelfServiceCard('Karla Koblenz', cardConfig)

    expect(card.fullName).toBe('Karla Koblenz')
    expect(card.expirationDate).toEqual(null)
    expect(card.extensions[0].state).toBe(null)
    expect(card.extensions[1].state).toBe(null)
  })

  it('should generate CardInfo', () => {
    const card = new SelfServiceCard('Karla Koblenz', cardConfig)
    expect(card.generateCardInfo().toJson({ enumAsInteger: true }) as object).toEqual({
      fullName: 'Karla Koblenz',
      extensions: {},
    })
  })
})
