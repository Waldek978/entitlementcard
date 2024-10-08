package app.ehrenamtskarte.backend.auth.database.repos

import app.ehrenamtskarte.backend.auth.database.ApiTokenEntity
import app.ehrenamtskarte.backend.auth.database.ApiTokens
import org.jetbrains.exposed.dao.id.EntityID
import java.time.LocalDate

object ApiTokensRepository {
    fun insert(
        token: ByteArray,
        adminId: EntityID<Int>,
        expirationDate: LocalDate,
        projectId: EntityID<Int>
    ): ApiTokenEntity {
        return ApiTokenEntity.new {
            this.token = token
            this.creator = adminId
            this.expirationDate = expirationDate
            this.projectId = projectId
        }
    }

    fun findByToken(token: ByteArray): ApiTokenEntity? {
        return ApiTokenEntity.find { (ApiTokens.token eq token) }.singleOrNull()
    }
}
