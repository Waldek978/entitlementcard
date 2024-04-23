package app.ehrenamtskarte.backend.verification.webservice.schema

import app.ehrenamtskarte.backend.auth.database.AdministratorEntity
import app.ehrenamtskarte.backend.auth.service.Authorizer
import app.ehrenamtskarte.backend.common.utils.convertDateStringToTimestamp
import app.ehrenamtskarte.backend.common.webservice.GraphQLContext
import app.ehrenamtskarte.backend.exception.service.ForbiddenException
import app.ehrenamtskarte.backend.exception.service.ProjectNotFoundException
import app.ehrenamtskarte.backend.exception.webservice.exceptions.RegionNotFoundException
import app.ehrenamtskarte.backend.projects.database.ProjectEntity
import app.ehrenamtskarte.backend.projects.database.Projects
import app.ehrenamtskarte.backend.regions.database.RegionEntity
import app.ehrenamtskarte.backend.verification.database.repos.CardRepository
import app.ehrenamtskarte.backend.verification.webservice.schema.types.CardStatisticsResultModel
import com.expediagroup.graphql.generator.annotations.GraphQLDescription
import graphql.schema.DataFetchingEnvironment
import org.jetbrains.exposed.sql.transactions.transaction

@Suppress("unused")
class CardStatisticsQueryService {

    @GraphQLDescription("Returns card statistics for project")
    fun getCardStatisticsInProject(project: String, dateStart: String, dateEnd: String, dfe: DataFetchingEnvironment): List<CardStatisticsResultModel> {
        val context = dfe.getContext<GraphQLContext>()
        val jwtPayload = context.enforceSignedIn()
        return transaction {
            val admin = AdministratorEntity.findById(jwtPayload.adminId)
            val projectEntity = ProjectEntity.find { Projects.project eq project }.firstOrNull()
                ?: throw ProjectNotFoundException(project)
            val projectId = projectEntity.id.value
            if (!Authorizer.mayViewCardStatisticsInProject(admin, projectId)) {
                throw ForbiddenException()
            }

            CardRepository.getCardStatisticsByProjectAndRegion(projectEntity.project, convertDateStringToTimestamp(dateStart), convertDateStringToTimestamp(dateEnd), null)
        }
    }

    @GraphQLDescription("Returns card statistics for region")
    fun getCardStatisticsInRegion(project: String, regionId: Int, dateStart: String, dateEnd: String, dfe: DataFetchingEnvironment): List<CardStatisticsResultModel> {
        val context = dfe.getContext<GraphQLContext>()
        val jwtPayload = context.enforceSignedIn()
        return transaction {
            val admin = AdministratorEntity.findById(jwtPayload.adminId)
            val projectEntity = ProjectEntity.find { Projects.project eq project }.firstOrNull()
                ?: throw ProjectNotFoundException(project)
            val region = RegionEntity.findById(regionId) ?: throw RegionNotFoundException()

            if (!Authorizer.mayViewCardStatisticsInRegion(admin, region)) {
                throw ForbiddenException()
            }

            CardRepository.getCardStatisticsByProjectAndRegion(projectEntity.project, convertDateStringToTimestamp(dateStart), convertDateStringToTimestamp(dateEnd), regionId)
        }
    }
}
