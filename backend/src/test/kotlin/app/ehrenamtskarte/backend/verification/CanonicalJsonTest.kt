package app.ehrenamtskarte.backend.verification

import Card
import app.ehrenamtskarte.backend.helper.CardInfoTestSample
import app.ehrenamtskarte.backend.helper.ExampleCardInfo
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

internal class CanonicalJsonTest {

    @Test
    fun mapEmptyCardInfo() {
        val cardInfo = Card.CardInfo.newBuilder().build()
        assertEquals(CanonicalJson.messageToMap(cardInfo), emptyMap())
    }

    @Test
    fun mapCardInfoWithFullName() {
        val wildName = "Biene Maja ßäЦЧШܐܳܠܰܦ"
        val cardInfo = Card.CardInfo.newBuilder().setFullName(wildName).build()
        assertEquals(CanonicalJson.messageToMap(cardInfo), mapOf("1" to wildName))
    }

    @Test
    fun mapCardInfoForBavarianBlueEAK() {
        val cardInfo = ExampleCardInfo.get(CardInfoTestSample.BavarianStandard)

        assertEquals(
            CanonicalJson.messageToMap(cardInfo),
            mapOf(
                "1" to "Max Mustermann",
                "2" to "14600",
                "3" to mapOf(
                    "1" to mapOf("1" to "16"), // extensionRegion
                    "4" to mapOf("1" to "0") // extensionBavariaCardType
                )
            )
        )
    }

    @Test
    fun mapCardInfoForBavarianGoldenEAK() {
        val cardInfo = ExampleCardInfo.get(CardInfoTestSample.BavarianGold)
        assertEquals(
            CanonicalJson.messageToMap(cardInfo),
            mapOf(
                "1" to "Max Mustermann",
                "3" to mapOf(
                    "1" to mapOf("1" to "16"), // extensionRegion
                    "4" to mapOf("1" to "1") // extensionBavariaCardType
                )
            )
        )
    }

    @Test
    fun mapCardInfoForNuernbergPass() {
        val cardInfo = ExampleCardInfo.get(CardInfoTestSample.Nuernberg)
        assertEquals(
            CanonicalJson.messageToMap(cardInfo),
            mapOf(
                "1" to "Max Mustermann",
                "2" to "14600",
                "3" to mapOf(
                    "1" to mapOf("1" to "93"), // extensionRegion
                    "2" to mapOf("1" to "-3650"), // extensionBirthday
                    "3" to mapOf("1" to "99999999") // extensionNuernbergPassId
                )
            )
        )
    }

    @Test
    fun mapCardInfoForNuernbergPassWithStartDay() {
        val cardInfo = ExampleCardInfo.get(CardInfoTestSample.NuernbergWithStartDay)
        assertEquals(
            CanonicalJson.messageToMap(cardInfo),
            mapOf(
                "1" to "Max Mustermann",
                "2" to "14600",
                "3" to mapOf(
                    "1" to mapOf("1" to "93"), // extensionRegion
                    "2" to mapOf("1" to "-3650"), // extensionBirthday
                    "3" to mapOf("1" to "99999999"), // extensionNuernbergPassId
                    "5" to mapOf("1" to "730") // extensionStartDay
                )
            )
        )
    }

    @Test
    fun emptyArray() {
        val input = emptyList<Any>()
        val expected = "[]"
        val actual = CanonicalJson.serializeToString(input)

        assertEquals(expected, actual)
    }

    @Test
    fun oneElementArray() {
        val input = listOf<Any>(123)
        val expected = "[123]"
        val actual = CanonicalJson.serializeToString(input)

        assertEquals(expected, actual)
    }

    @Test
    fun multiElementArray() {
        val input = listOf<Any?>(123, 456, "hello", true, null)
        val expected = """[123,456,"hello",true,null]"""
        val actual = CanonicalJson.serializeToString(input)

        assertEquals(expected, actual)
    }

    @Test
    fun objectInArray() {
        val input = listOf<Any?>(mapOf("b" to 123, 1 to "string"))
        val expected = """[{"1":"string","b":123}]"""
        val actual = CanonicalJson.serializeToString(input)

        assertEquals(expected, actual)
    }

    @Test
    fun emptyObject() {
        val input = emptyMap<Any, Any>()
        val expected = "{}"
        val actual = CanonicalJson.serializeToString(input)

        assertEquals(expected, actual)
    }

    @Test
    fun objectWithNullValue() {
        val input = mapOf("test" to null)
        val expected = """{"test":null}"""
        val actual = CanonicalJson.serializeToString(input)

        assertEquals(expected, actual)
    }

    @Test
    fun objectWithOneProperty() {
        val input = mapOf("hello" to "world")
        val expected = """{"hello":"world"}"""
        val actual = CanonicalJson.serializeToString(input)

        assertEquals(expected, actual)
    }

    @Test
    fun objectWithMultipleProperties() {
        val input = mapOf("hello" to "world", "number" to 123)
        val expected = """{"hello":"world","number":123}"""
        val actual = CanonicalJson.serializeToString(input)

        assertEquals(expected, actual)
    }

    @Test
    fun nullInput() {
        val input = null
        val expected = "null"
        val actual = CanonicalJson.serializeToString(input)

        assertEquals(expected, actual)
    }

    @Test
    fun unknownType() {
        val input = object { val unknown = "unknown" }

        assertFailsWith<Error> { CanonicalJson.serializeToString(input) }
    }

    @Test
    fun objectWithNumberKey() {
        val input = mapOf(42 to "foo")
        val expected = """{"42":"foo"}"""
        val actual = CanonicalJson.serializeToString(input)

        assertEquals(expected, actual)
    }
}
