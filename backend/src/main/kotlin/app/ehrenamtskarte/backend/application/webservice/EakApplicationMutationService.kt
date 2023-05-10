package app.ehrenamtskarte.backend.application.webservice

import app.ehrenamtskarte.backend.application.database.ApplicationEntity
import app.ehrenamtskarte.backend.application.database.repos.ApplicationRepository
import app.ehrenamtskarte.backend.application.webservice.schema.create.Application
import app.ehrenamtskarte.backend.auth.database.AdministratorEntity
import app.ehrenamtskarte.backend.auth.service.Authorizer.mayDeleteApplicationsInRegion
import app.ehrenamtskarte.backend.common.webservice.GraphQLContext
import app.ehrenamtskarte.backend.exception.service.ForbiddenException
import app.ehrenamtskarte.backend.exception.service.UnauthorizedException
import app.ehrenamtskarte.backend.exception.webservice.exceptions.InvalidFileSizeException
import app.ehrenamtskarte.backend.exception.webservice.exceptions.InvalidFileTypeException
import app.ehrenamtskarte.backend.exception.webservice.exceptions.MailNotSentException
import app.ehrenamtskarte.backend.exception.webservice.exceptions.RegionNotFoundException
import app.ehrenamtskarte.backend.mail.Mailer
import app.ehrenamtskarte.backend.regions.database.repos.RegionsRepository
import com.expediagroup.graphql.generator.annotations.GraphQLDescription
import graphql.execution.DataFetcherResult
import graphql.schema.DataFetchingEnvironment
import org.jetbrains.exposed.sql.transactions.transaction

@Suppress("unused")
class EakApplicationMutationService {

    @GraphQLDescription("Stores a new application for an EAK")
    fun addEakApplication(
        regionId: Int,
        application: Application,
        project: String,
        dfe: DataFetchingEnvironment
    ): DataFetcherResult<Boolean> {
        val context = dfe.getContext<GraphQLContext>()
        val backendConfig = context.backendConfiguration
        val projectConfig = backendConfig.projects.first { it.id == project }

        transaction { RegionsRepository.findByIdInProject(project, regionId) } ?: throw RegionNotFoundException()
        // Validate that all files are png, jpeg or pdf files and at most 5MB.
        val allowedContentTypes = setOf("application/pdf", "image/png", "image/jpeg")
        val maxFileSizeBytes = 5 * 1000 * 1000
        if (!context.files.all { it.contentType in allowedContentTypes }) {
            throw InvalidFileTypeException()
        }
        if (!context.files.all { it.size <= maxFileSizeBytes }) {
            throw InvalidFileSizeException()
        }

        val (applicationEntity, verificationEntities) = transaction {
            ApplicationRepository.persistApplication(
                application.toJsonField(),
                application.extractApplicationVerifications(),
                regionId,
                context.applicationData,
                context.files
            )
        }

        Mailer.sendApplicationApplicantMail(backendConfig, projectConfig, application.personalData, applicationEntity.accessKey)

        val dataFetcherResultBuilder = DataFetcherResult.newResult<Boolean>()
        for (applicationVerification in verificationEntities) {
            try {
                Mailer.sendApplicationVerificationMail(backendConfig, projectConfig, applicationVerification)
            } catch (exception: MailNotSentException) {
                dataFetcherResultBuilder.error(exception)
            }
        }
        Mailer.sendNotificationForApplicationMails(project, backendConfig, projectConfig)

        return dataFetcherResultBuilder.data(true).build()
    }

    @GraphQLDescription("Deletes the application with specified id")
    fun deleteApplication(
        applicationId: Int,
        dfe: DataFetchingEnvironment
    ): Boolean {
        val context = dfe.getContext<GraphQLContext>()
        val jwtPayload = context.enforceSignedIn()

        return transaction {
            val application = ApplicationEntity.findById(applicationId) ?: throw UnauthorizedException()
            // We throw an UnauthorizedException here, as we do not know whether there was an application with id
            // `applicationId` and whether this application was contained in the user's project & region.

            val user = AdministratorEntity.findById(jwtPayload.adminId)
                ?: throw UnauthorizedException()

            if (!mayDeleteApplicationsInRegion(user, application.regionId.value)) {
                throw ForbiddenException()
            }

            ApplicationRepository.delete(applicationId, context)
        }
    }

    @GraphQLDescription("Withdraws the application")
    fun withdrawApplication(accessKey: String): Boolean {
        return transaction {
            ApplicationRepository.withdrawApplication(accessKey)
        }
    }

    @GraphQLDescription("Verifies or rejects an application verification")
    fun verifyOrRejectApplicationVerification(
        project: String,
        accessKey: String,
        verified: Boolean,
        dfe: DataFetchingEnvironment
    ): Boolean {
        return transaction {
            if (verified) {
                val context = dfe.getContext<GraphQLContext>()
                val backendConfig = context.backendConfiguration
                val projectConfig = backendConfig.projects.first { it.id == project }
                val successful = ApplicationRepository.verifyApplicationVerification(accessKey)
                Mailer.sendNotificationForVerificationMails(project, backendConfig, projectConfig)

                successful
            } else {
                ApplicationRepository.rejectApplicationVerification(accessKey)
            }
        }
    }
}
