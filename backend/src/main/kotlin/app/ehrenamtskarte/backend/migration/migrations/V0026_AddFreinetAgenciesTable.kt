package app.ehrenamtskarte.backend.migration.migrations

import app.ehrenamtskarte.backend.migration.Migration
import app.ehrenamtskarte.backend.migration.Statement

/**
 * Adds freinetagencies table
 */
@Suppress("ClassName")
internal class V0026_AddFreinetAgenciesTable : Migration() {
    override val migrate: Statement = {
        exec(
            """
                CREATE TABLE freinetagencies (
                    id SERIAL PRIMARY KEY ,
                    "regionId" INTEGER NOT NULL,
                    "agencyId" INTEGER NOT NULL,
                    "apiAccessKey" character varying(10) NOT NULL 
                );
             ALTER TABLE freinetagencies ADD CONSTRAINT fk_freinetagencies_regionid__id FOREIGN KEY ("regionId") REFERENCES regions(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
             ALTER TABLE freinetagencies ADD CONSTRAINT freinetagencies_agencyid_unique UNIQUE ("agencyId");
            """.trimIndent()
        )
    }
}
