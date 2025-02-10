package app.ehrenamtskarte.backend.regions.database

import app.ehrenamtskarte.backend.common.webservice.EAK_BAYERN_PROJECT
import app.ehrenamtskarte.backend.common.webservice.KOBLENZ_PASS_PROJECT
import app.ehrenamtskarte.backend.common.webservice.NUERNBERG_PASS_PROJECT
import app.ehrenamtskarte.backend.projects.database.ProjectEntity
import app.ehrenamtskarte.backend.regions.webservice.schema.types.FreinetAgency
import org.jetbrains.exposed.sql.SizedIterable
import org.jetbrains.exposed.sql.transactions.transaction

fun insertOrUpdateRegions(agencies: List<FreinetAgency>?) {
    val projects = ProjectEntity.all()
    val dbRegions = RegionEntity.all()
    val dbFreinetRegionInformation = FreinetAgenciesEntity.all()

    fun createOrUpdateRegion(
        regionProjectId: String,
        regionName: String,
        regionPrefix: String,
        regionKey: String,
        regionWebsite: String,
        regionActivatedForApplication: Boolean
    ) {
        val project =
            projects.firstOrNull { it.project == regionProjectId }
                ?: throw Error("Required project '$regionProjectId' not found!")
        val region = dbRegions.singleOrNull { it.projectId == project.id }
        if (region == null) {
            RegionEntity.new {
                projectId = project.id
                name = regionName
                prefix = regionPrefix
                regionIdentifier = regionKey
                website = regionWebsite
                activatedForApplication = regionActivatedForApplication
            }
        } else {
            region.name = regionName
            region.prefix = regionPrefix
            region.website = regionWebsite
            region.regionIdentifier = regionKey
            region.activatedForApplication = regionActivatedForApplication
        }
    }

    transaction {
        // Create or update eak regions in database
        val eakProject =
            projects.firstOrNull { it.project == EAK_BAYERN_PROJECT }
                ?: throw Error("Required project '$EAK_BAYERN_PROJECT' not found!")
        EAK_BAYERN_REGIONS.forEach { eakRegion ->
            val dbRegion = dbRegions.find { it.regionIdentifier == eakRegion[2] && it.projectId == eakProject.id }
            val regionEntity: RegionEntity
            if (dbRegion == null) {
                regionEntity = RegionEntity.new {
                    projectId = eakProject.id
                    name = eakRegion[1]
                    prefix = eakRegion[0]
                    regionIdentifier = eakRegion[2]
                    website = eakRegion[3]
                }
            } else {
                regionEntity = dbRegion
                dbRegion.name = eakRegion[1]
                dbRegion.prefix = eakRegion[0]
                dbRegion.website = eakRegion[3]
            }
            val agency = agencies?.find { it -> it.arsList.any { it.startsWith(eakRegion[2]) } }
            if (agency != null) {
                insertOrUpdateFreinetRegionInformation(agency, dbFreinetRegionInformation, regionEntity)
            }
        }
        createOrUpdateRegion(NUERNBERG_PASS_PROJECT, "Nürnberg", "Stadt", "09564", "https://nuernberg.de", false)
        createOrUpdateRegion(KOBLENZ_PASS_PROJECT, "Koblenz", "Stadt", "07111", "https://koblenz.de/", false)
    }
}

fun insertOrUpdateFreinetRegionInformation(
    agency: FreinetAgency,
    dbFreinetRegionInformation: SizedIterable<FreinetAgenciesEntity>,
    regionEntity: RegionEntity
) {
    val dbAgency = dbFreinetRegionInformation.find { it.agencyId == agency.agencyId }
    if (dbAgency == null) {
        FreinetAgenciesEntity.new {
            regionId = regionEntity.id
            agencyId = agency.agencyId
            apiAccessKey = agency.apiAccessKey
        }
    } else {
        dbAgency.agencyId = agency.agencyId
        dbAgency.apiAccessKey = agency.apiAccessKey
    }
}
