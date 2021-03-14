/*
 * This file was generated by the Gradle 'init' task.
 *
 * This generated file contains a sample Kotlin application project to get you started.
 */

/**
 * The exposed_version (taken from gradle.properties)
 */
val exposed_version: String by project

plugins {
    // Apply the Kotlin JVM plugin to add support for Kotlin.
    id("org.jetbrains.kotlin.jvm") version "1.3.72"

    // Apply the application plugin to add support for building a CLI application.
    application
}

repositories {
    // Use jcenter for resolving dependencies.
    // You can declare any Maven/Ivy/file repository here.
    jcenter()
    mavenCentral()
}

dependencies {
    implementation("com.github.ajalt.clikt:clikt:3.0.1")
    implementation("io.javalin:javalin:3.12.0")
    implementation("com.google.code.gson", "gson", "2.8.6")
    implementation("org.slf4j", "slf4j-simple", "1.7.30")
    implementation("org.apache.commons", "commons-text", "1.9")

    implementation("com.expediagroup:graphql-kotlin-schema-generator:3.6.6")
    implementation("com.graphql-java-kickstart:graphql-java-servlet:11.1.0")

    // Align versions of all Kotlin components
    implementation(platform("org.jetbrains.kotlin:kotlin-bom"))

    // Use the Kotlin JDK 8 standard library.
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")

    // Use the Kotlin test library.
    testImplementation("org.jetbrains.kotlin:kotlin-test")

    // Use the Kotlin JUnit integration.
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit")

    implementation("org.jetbrains.exposed", "exposed-core", exposed_version)
    implementation("org.jetbrains.exposed", "exposed-dao", exposed_version)
    implementation("org.jetbrains.exposed", "exposed-jdbc", exposed_version)
    implementation("org.jetbrains.exposed", "exposed-java-time", exposed_version)
    implementation("org.postgresql", "postgresql", "42.2.18")
    implementation("com.kohlschutter.junixsocket", "junixsocket-core", "2.3.2")
    implementation("com.kohlschutter.junixsocket", "junixsocket-common", "2.3.2")

    implementation("net.postgis", "postgis-jdbc", "2.5.0")

    implementation("io.ktor:ktor-client-core:1.4.0")
    implementation("io.ktor:ktor-client-cio:1.4.0")

    implementation("com.beust:klaxon:5.0.1")

    implementation("com.fasterxml.jackson.dataformat:jackson-dataformat-xml:2.9.6")
    implementation ("com.fasterxml.jackson.module:jackson-module-kotlin:2.11.+")

    implementation("com.eatthepath:java-otp:0.2.0")
}

application {
    // Define the main class for the application.
    mainClassName = "app.ehrenamtskarte.backend.EntryPointKt"
}

tasks.withType<JavaExec>().configureEach {
    systemProperties = properties
}
