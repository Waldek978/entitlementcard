package app.ehrenamtskarte.backend.stores.importer.steps

import app.ehrenamtskarte.backend.stores.ALTERNATIVE_MISCELLANEOUS_CATEGORY_ID
import app.ehrenamtskarte.backend.stores.MISCELLANEOUS_CATEGORY_ID
import app.ehrenamtskarte.backend.stores.importer.PipelineStep
import app.ehrenamtskarte.backend.stores.importer.matchesNa
import app.ehrenamtskarte.backend.stores.importer.types.LbeAcceptingStore
import org.slf4j.Logger

/**
 * Filter and removes [LbeAcceptingStore] with invalid data.
 * These are especially stores without name, location or an invalid category.
 */
class FilterLbe(private val logger: Logger): PipelineStep<List<LbeAcceptingStore>, List<LbeAcceptingStore>>() {
    private val invalidLocations = arrayOf("Musterhausen")

    override fun execute(input: List<LbeAcceptingStore>): List<LbeAcceptingStore> = input.filter { filterLbe(it) }

    private fun filterLbe(store: LbeAcceptingStore) = try {
        store.isValidName() && store.isValidCategory() && store.isValidLocation()
    } catch (e: Exception) {
        logger.info("$store was filtered out because of an unknown exception while filtering", e)
        false
    }

    private fun String?.isUnavailable(): Boolean {
        return this.isNullOrBlank() || matchesNa(this)
    }

    private fun LbeAcceptingStore.isValidName(): Boolean {
        return if (name.isUnavailable()) {
            logger.info("'$this' was filtered out because name '$name' is invalid")
            false
        } else {
            true
        }
    }

    private fun LbeAcceptingStore.isValidLocation(): Boolean {
        return if (location.isUnavailable() || invalidLocations.contains(location)) {
            logger.info("'$name' was filtered out because location '$location' is invalid")
            false
        } else {
            true
        }
    }

    private fun LbeAcceptingStore.isValidCategory(): Boolean {
        val validCategories = (0..MISCELLANEOUS_CATEGORY_ID) + listOf(ALTERNATIVE_MISCELLANEOUS_CATEGORY_ID)
        val valid = category?.toIntOrNull() in validCategories

        if (!valid)
            logger.info("'$name' was filtered out because category '$category' is invalid")

        return valid
    }

}
