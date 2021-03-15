package app.ehrenamtskarte.backend.common.webservice

import app.ehrenamtskarte.backend.auth.webservice.JwtService
import app.ehrenamtskarte.backend.auth.webservice.authGraphQlParams
import app.ehrenamtskarte.backend.regions.webservice.regionsGraphQlParams
import app.ehrenamtskarte.backend.application.webservice.applicationGraphQlParams
import app.ehrenamtskarte.backend.stores.webservice.storesGraphQlParams
import app.ehrenamtskarte.backend.verification.webservice.verificationGraphQlParams
import com.auth0.jwt.exceptions.*
import com.expediagroup.graphql.toSchema
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.node.ArrayNode
import com.fasterxml.jackson.databind.node.ObjectNode
import com.fasterxml.jackson.databind.node.TextNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import graphql.ExceptionWhileDataFetching
import graphql.ExecutionInput
import graphql.ExecutionResult
import graphql.GraphQL
import io.javalin.http.Context
import io.javalin.http.util.MultipartUtil
import java.io.IOException
import java.lang.IllegalArgumentException
import java.lang.IllegalStateException
import java.util.concurrent.ExecutionException

class GraphQLHandler(
    private val graphQLParams: GraphQLParams =
        storesGraphQlParams stitch verificationGraphQlParams
            stitch applicationGraphQlParams stitch regionsGraphQlParams stitch authGraphQlParams
) {
    val graphQLSchema = toSchema(
        graphQLParams.config,
        graphQLParams.queries,
        graphQLParams.mutations,
        graphQLParams.subscriptions
    )
    private val graphQL = GraphQL.newGraphQL(graphQLSchema).build()!!

    private val mapper = jacksonObjectMapper()

    /**
     * Get payload from the request.
     */
    private fun getPayload(context: Context): Map<String, Any>? = try {
        if (!context.isMultipart()) {
            mapper.readValue<Map<String, Any>>(context.body())
        } else {
            val servlet = context.req
            MultipartUtil.preUploadFunction(servlet)
            val parts = servlet.parts.map { it.name to it }.toMap()
            val operationsJson = parts["operations"]?.inputStream ?: throw IOException("Missing operations part.")
            val operations = mapper.readTree(operationsJson)
            val mapJson = context.formParam("map")
            if (mapJson != null) {
                val substitutions = mapper.readValue<Map<String, List<String>>>(mapJson)
                substitutions.forEach { (key, paths) ->
                    if (!parts.containsKey(key) || key == "operations" || key == "map")
                        throw IllegalArgumentException("Part with key '$key' not found or invalid!")
                    paths.forEach { path -> operations.substitute(path, key) }
                }
            }
            val result = mapper.readValue<MutableMap<String, Any>>(mapper.treeAsTokens(operations))
            result["localContext"] = parts
            result
        }
    } catch (e: IOException) {
        throw IOException("Unable to parse GraphQL payload.")
    }

    private fun JsonNode.substitute(path: String, value: String): Unit {
        val paths = path.split(".");
        var node = this

        for (fieldOrIndex in paths.subList(0, paths.size - 1)) {
            node = when (node) {
                is ArrayNode -> node.path(
                    fieldOrIndex.toIntOrNull() ?: throw IllegalArgumentException(
                        "Expecting array index, but could not convert to integer."
                    )
                )
                is ObjectNode -> node.path(fieldOrIndex)
                else -> throw IllegalStateException("Expected ArrayNode or ObjectNode.")
            }
            if (node.isMissingNode || node.isNull) throw IllegalArgumentException("Accessing unavailable field")
        }

        val lastPath = paths.last()
        val replaceWith = ObjectNode(mapper.nodeFactory, mapOf("key" to TextNode(value)))
        when (node) {
            is ArrayNode -> node[lastPath.toIntOrNull()
                ?: throw IllegalArgumentException("Expecting array index, but could not convert to integer.")] =
                replaceWith
            is ObjectNode -> node.set<ObjectNode>(lastPath, replaceWith)
            else -> throw  IllegalStateException("Expected ArrayNode or ObjectNode.")
        }
    }

    /**
     * Get the variables passed in the request.
     */
    private fun getVariables(payload: Map<String, *>) =
        payload.getOrElse("variables") { emptyMap<String, Any>() } as Map<String, Any>

    /**
     * Get any errors and data from [executionResult].
     */
    private fun getResult(executionResult: ExecutionResult): MutableMap<String, Any> {
        val result = mutableMapOf<String, Any>()

        if (executionResult.errors.isNotEmpty()) {
            // if we encounter duplicate errors while data fetching, only include one copy
            result["errors"] = executionResult.errors.distinctBy {
                if (it is ExceptionWhileDataFetching) {
                    it.exception
                } else {
                    it
                }
            }
            // if we encounter a UnauthorizedException, rethrow it
            executionResult.errors
                .filterIsInstance<ExceptionWhileDataFetching>()
                .map { it.exception }
                .firstOrNull { it is UnauthorizedException }
                ?.let { throw it }
        }

        try {
            // if data is null, get data will fail exceptionally
            result["data"] = executionResult.getData<Any>()
        } catch (e: Exception) {
        }

        return result
    }

    private fun getJwtTokenFromHeader(context: Context): String? {
        val header = context.header("Authorization") ?: return null
        val split = header.split(" ")
        return if (split.size != 2 || split[0] != "Bearer") null else split[1]
    }

    private fun getGraphQLContext(context: Context) =
        try {
            GraphQLContext(getJwtTokenFromHeader(context)?.let(JwtService::verifyToken))
        } catch (e: Exception) {
            when (e) {
                is JWTDecodeException, is AlgorithmMismatchException, is SignatureVerificationException,
                is InvalidClaimException, is TokenExpiredException -> GraphQLContext(null)
                else -> throw e
            }
        }

    /**
     * Execute a query against schema
     */
    fun handle(context: Context) {
        val payload = getPayload(context)
        val graphQLContext = getGraphQLContext(context)

        // Execute the query against the schema
        try {
            val executionInput =
                ExecutionInput.Builder()
                    .context(graphQLContext)
                    .query(payload["query"].toString())
                    .variables(getVariables(payload))
                    .dataLoaderRegistry(graphQLParams.dataLoaderRegistry)
                    .localContext(payload["localContext"])
                    .build()

            val executionResult = graphQL.executeAsync(executionInput).get()
            val result = getResult(executionResult)

            // write response as json
            context.json(result)
        } catch (e: UnauthorizedException) {
            context.res.sendError(401)
        } catch (e: ExecutionException) {
            e.printStackTrace()
            context.res.sendError(500)
        }
    }
}
