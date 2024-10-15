package app.ehrenamtskarte.backend.helper

import app.ehrenamtskarte.backend.cards.database.CardEntity
import app.ehrenamtskarte.backend.cards.database.Cards
import app.ehrenamtskarte.backend.cards.database.CodeType
import app.ehrenamtskarte.backend.stores.database.AcceptingStoreEntity
import app.ehrenamtskarte.backend.stores.database.AcceptingStores
import app.ehrenamtskarte.backend.stores.database.Addresses
import app.ehrenamtskarte.backend.stores.database.Contacts
import app.ehrenamtskarte.backend.stores.database.PhysicalStores
import app.ehrenamtskarte.backend.userdata.database.UserEntitlements
import app.ehrenamtskarte.backend.userdata.database.UserEntitlementsEntity
import net.postgis.jdbc.geometry.Point
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.insertAndGetId
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.time.LocalDate
import kotlin.random.Random

/**
 * Helper object for creating test data in the database
 */
object TestData {

    fun createAcceptingStore(
        name: String = "Test store",
        description: String? = "100% Ermäßigung\n\n100% discount",
        street: String = "Teststr. 10",
        postalCode: String = "90408",
        location: String = "Nürnberg",
        coordinates: Point = Point(),
        email: String? = "info@test.de",
        website: String? = "https://www.test.de",
        telephone: String? = "0911/123456",
        projectId: Int = 2,
        categoryId: Int = 17
    ): AcceptingStoreEntity {
        return transaction {
            val addressId = Addresses.insertAndGetId {
                it[Addresses.street] = street
                it[Addresses.postalCode] = postalCode
                it[Addresses.location] = location
                it[Addresses.countryCode] = "de"
            }
            val contactId = Contacts.insertAndGetId {
                it[Contacts.email] = email
                it[Contacts.telephone] = telephone
                it[Contacts.website] = website
            }
            val acceptingStoreRow = AcceptingStores.insert {
                it[AcceptingStores.name] = name
                it[AcceptingStores.description] = description
                it[AcceptingStores.contactId] = contactId
                it[AcceptingStores.categoryId] = categoryId
                it[AcceptingStores.regionId] = null
                it[AcceptingStores.projectId] = projectId
            }.resultedValues!!.first()
            val acceptingStoreEntity = AcceptingStoreEntity.wrapRow(acceptingStoreRow)
            PhysicalStores.insert {
                it[PhysicalStores.storeId] = acceptingStoreEntity.id.value
                it[PhysicalStores.addressId] = addressId
                it[PhysicalStores.coordinates] = coordinates
            }
            acceptingStoreEntity
        }
    }

    fun createUserEntitlements(
        userHash: String,
        startDate: LocalDate = LocalDate.now().minusDays(1L),
        endDate: LocalDate = LocalDate.now().plusYears(1L),
        revoked: Boolean = false,
        regionId: Int
    ): UserEntitlementsEntity {
        return transaction {
            val result = UserEntitlements.insert {
                it[UserEntitlements.userHash] = userHash.toByteArray()
                it[UserEntitlements.startDate] = startDate
                it[UserEntitlements.endDate] = endDate
                it[UserEntitlements.revoked] = revoked
                it[UserEntitlements.regionId] = regionId
            }.resultedValues!!.first()
            UserEntitlementsEntity.wrapRow(result)
        }
    }

    fun createDynamicCard(
        totpSecret: ByteArray? = null,
        expirationDay: Long? = null,
        issueDate: Instant = Instant.now(),
        revoked: Boolean = false,
        regionId: Int,
        issuerId: Int? = null,
        firstActivationDate: Instant? = null,
        entitlementId: Int? = null,
        startDay: Long? = null
    ): CardEntity {
        val fakeActivationSecretHash = Random.nextBytes(20)
        return createCard(
            fakeActivationSecretHash,
            totpSecret,
            expirationDay,
            issueDate,
            revoked,
            regionId,
            issuerId,
            CodeType.DYNAMIC,
            firstActivationDate,
            entitlementId,
            startDay
        )
    }

    fun createStaticCard(
        expirationDay: Long? = null,
        issueDate: Instant = Instant.now(),
        revoked: Boolean = false,
        regionId: Int,
        issuerId: Int? = null,
        firstActivationDate: Instant? = null,
        entitlementId: Int? = null,
        startDay: Long? = null
    ): CardEntity {
        return createCard(
            activationSecretHash = null,
            totpSecret = null,
            expirationDay,
            issueDate,
            revoked,
            regionId,
            issuerId,
            CodeType.STATIC,
            firstActivationDate,
            entitlementId,
            startDay
        )
    }

    private fun createCard(
        activationSecretHash: ByteArray? = null,
        totpSecret: ByteArray? = null,
        expirationDay: Long? = null,
        issueDate: Instant = Instant.now(),
        revoked: Boolean = false,
        regionId: Int,
        issuerId: Int? = null,
        codeType: CodeType,
        firstActivationDate: Instant? = null,
        entitlementId: Int? = null,
        startDay: Long? = null
    ): CardEntity {
        val fakeCardInfoHash = Random.nextBytes(20)
        return transaction {
            val result = Cards.insert {
                it[Cards.activationSecretHash] = activationSecretHash
                it[Cards.totpSecret] = totpSecret
                it[Cards.expirationDay] = expirationDay
                it[Cards.issueDate] = issueDate
                it[Cards.revoked] = revoked
                it[Cards.regionId] = regionId
                it[Cards.issuerId] = issuerId
                it[Cards.cardInfoHash] = fakeCardInfoHash
                it[Cards.codeType] = codeType
                it[Cards.firstActivationDate] = firstActivationDate
                it[Cards.entitlementId] = entitlementId
                it[Cards.startDay] = startDay
            }.resultedValues!!.first()
            CardEntity.wrapRow(result)
        }
    }
}
