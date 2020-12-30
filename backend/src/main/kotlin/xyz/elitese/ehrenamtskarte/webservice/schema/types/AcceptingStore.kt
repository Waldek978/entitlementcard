package xyz.elitese.ehrenamtskarte.webservice.schema.types

import graphql.schema.DataFetchingEnvironment
import xyz.elitese.ehrenamtskarte.webservice.dataloader.CATEGORY_LOADER_NAME
import xyz.elitese.ehrenamtskarte.webservice.dataloader.CONTACT_LOADER_NAME
import xyz.elitese.ehrenamtskarte.webservice.dataloader.PHYSICAL_STORE_BY_STORE_ID_LOADER_NAME

import java.util.concurrent.CompletableFuture


data class AcceptingStore(
    val id: Int,
    val name: String,
    val description: String,
    val contactId: Int,
    val categoryId: Int
) {

    fun contact(dataFetchingEnvironment: DataFetchingEnvironment): CompletableFuture<Contact> =
        dataFetchingEnvironment.getDataLoader<Int, Contact>(CONTACT_LOADER_NAME).load(contactId)

    fun category(dataFetchingEnvironment: DataFetchingEnvironment): CompletableFuture<Category> =
        dataFetchingEnvironment.getDataLoader<Int, Category>(CATEGORY_LOADER_NAME).load(categoryId)

    fun physicalStore(dataFetchingEnvironment: DataFetchingEnvironment): CompletableFuture<PhysicalStore?> =
        dataFetchingEnvironment.getDataLoader<Int, PhysicalStore?>(PHYSICAL_STORE_BY_STORE_ID_LOADER_NAME).load(id)
}
