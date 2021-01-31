package app.ehrenamtskarte.backend.verification.domain

import java.time.LocalDateTime

data class Card(val totpSecret: List<Byte>, val expirationDate: LocalDateTime, val cardDetailsHash: List<Byte>) {
    val hasExpired: Boolean
    get() = expirationDate.isAfter(LocalDateTime.now())
}
