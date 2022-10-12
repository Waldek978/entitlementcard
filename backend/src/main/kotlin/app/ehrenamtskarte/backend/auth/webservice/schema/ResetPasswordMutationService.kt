package app.ehrenamtskarte.backend.auth.webservice.schema

import app.ehrenamtskarte.backend.auth.database.AdministratorEntity
import app.ehrenamtskarte.backend.auth.database.Administrators
import app.ehrenamtskarte.backend.auth.database.repos.AdministratorsRepository
import app.ehrenamtskarte.backend.mail.sendMail
import app.ehrenamtskarte.backend.projects.database.ProjectEntity
import app.ehrenamtskarte.backend.projects.database.Projects
import com.expediagroup.graphql.generator.annotations.GraphQLDescription
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.select
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDateTime

@Suppress("unused")
class ResetPasswordMutationService {
    @GraphQLDescription("Sends a mail that allows the administrator to reset their password.")
    fun sendResetMail(project: String, email: String): Boolean {
        transaction {
            val user = Administrators.innerJoin(Projects).slice(Administrators.columns)
                .select((Projects.project eq project) and (Administrators.email eq email))
                .single().let { AdministratorEntity.wrapRow(it) }
            val projectEntity = ProjectEntity.findById(user.projectId)!!

            val key = AdministratorsRepository.setNewPasswordResetKey(user)
            sendMail(email, "Passwort Zurücksetzen", generateResetMailMessage(key, projectEntity.host))
        }
        return true
    }

    private fun generateResetMailMessage(key: String, host: String): String {
        return """
            Guten Tag,
            
            Sie haben angefragt, Ihr Passwort für $host zurückzusetzen.
            Sie können Ihr Passwort unter dem folgenden Link zurücksetzen:
            https://$host/reset-password/$key
            
            Dieser Link ist 24 Stunden gültig.
            
            Mit freundlichen Grüßen,
            Ihr Digitalfabrik Team
        """.trimIndent()
    }

    @GraphQLDescription("Reset the administrator's password")
    fun resetPassword(project: String, email: String, passwordResetKey: String, newPassword: String): Boolean {
        val user = transaction {
            Administrators.innerJoin(Projects).slice(Administrators.columns)
                .select((Projects.project eq project) and (Administrators.email eq email))
                .single().let { AdministratorEntity.wrapRow(it) }
        }

        if (user.passwordResetKeyExpiry!!.isBefore(LocalDateTime.now())) {
            throw Exception("Password reset key has expired.")
        } else if (user.passwordResetKey != passwordResetKey) {
            throw Exception("Password reset keys do not match.")
        }

        transaction {
            AdministratorsRepository.changePassword(user, newPassword)
        }
        return true
    }
}
