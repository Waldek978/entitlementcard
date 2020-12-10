package xyz.elitese.ehrenamtskarte.webservice.schema.types

data class Address(
        val street: String,
        val houseNumber: String,
        val postalCode: String,
        val location: String,
        val state: String
)
