package app.ehrenamtskarte.backend.stores.importer

import app.ehrenamtskarte.backend.stores.importer.steps.*
import io.ktor.client.HttpClient
import org.slf4j.LoggerFactory

object DataImporter {
    private val httpClient = HttpClient()

    fun import(manualImport: Boolean): Boolean {
        val logger = LoggerFactory.getLogger(DataImporter::class.java)
        val pipe = {
            Unit.addStep(Download(logger, httpClient), logger) { logger.info("== Download raw data ==" )}
                .addStep(PreSanitizeFilter(logger), logger) { logger.info("== Filter raw data ==") }
                .addStep(Map(logger), logger) { logger.info("== Map raw to internal data ==") }
                .addStep(Sanitize(logger, httpClient), logger) { logger.info("== Sanitize data ==") }
                .addStep(PostSanitizeFilter(logger, httpClient), logger) { logger.info("== Filter sanitized data ==") }
                .addStep(Encode(logger), logger) { logger.info("== Handle encoding issues ==") }
                .addStep(Store(logger, manualImport), logger) { logger.info("== Store remaining data to db ==") }
        }

        return try {
            pipe()
            logger.info("== Pipeline successfully finished ==")
            true
        } catch (e : Exception) {
            logger.info("== Pipeline was aborted without altering the database ==", e)
            false
        }
    }
}
