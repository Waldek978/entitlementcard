package app.ehrenamtskarte.backend.application.webservice.schema.create

import app.ehrenamtskarte.backend.application.webservice.schema.view.AttachmentView
import app.ehrenamtskarte.backend.application.webservice.schema.view.JsonField
import app.ehrenamtskarte.backend.application.webservice.schema.view.Type
import app.ehrenamtskarte.backend.application.webservice.utils.JsonFieldSerializable

enum class AmountOfWorkUnit {
    HOURS_PER_WEEK,
    HOURS_PER_YEAR
}

data class WorkAtOrganization(
    val organization: Organization,
    val amountOfWork: Double,
    val amountOfWorkUnit: AmountOfWorkUnit,
    val responsibility: String,
    val workSinceDate: String,
    val payment: Boolean,
    val certificate: Attachment?
) : JsonFieldSerializable {
    override fun toJsonField(): JsonField {
        return JsonField(
            "workAtOrganization", mapOf("de" to "Arbeit bei Organisation oder Verein"), Type.Array,
            listOfNotNull(
                organization.toJsonField(),
                JsonField("amountOfWork", mapOf("de" to "Arbeitsaufwand"), Type.Number, amountOfWork),
                JsonField(
                    "amountOfWorkUnit", mapOf("de" to "Aufwandseinheit"), Type.String, when (amountOfWorkUnit) {
                        AmountOfWorkUnit.HOURS_PER_WEEK -> "Stunden pro Woche"
                        AmountOfWorkUnit.HOURS_PER_YEAR -> "Stunden pro Jahr"
                    }
                ),
                JsonField("responsibility", mapOf("de" to "Funktion"), Type.String, responsibility),
                JsonField("workSinceDate", mapOf("de" to "Datum des Arbeitsbeginns"), Type.String, workSinceDate),
                JsonField(
                    "payment",
                    mapOf("de" to "Bezahlung außerhalb von Auslagenersatz oder Erstattung der Kosten"),
                    Type.Boolean,
                    payment
                ),
                if (certificate != null)
                    JsonField(
                        "certificate",
                        mapOf("de" to "Zertifikat"),
                        Type.Attachment,
                        AttachmentView.from(certificate)
                    )
                else null
            )
        )
    }
}
