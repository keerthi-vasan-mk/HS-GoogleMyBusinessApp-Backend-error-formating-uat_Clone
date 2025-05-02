import { MigrationInterface, QueryRunner } from 'typeorm';

export class ErrorLog1567176740003 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE TABLE "errors"
            (
                "id" SERIAL NOT NULL,
                "uid" character varying NOT NULL,
                "error" character varying NOT NULL,
                "httpCode" integer NOT NULL,
                "apiActionRequest" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_f1ab2df89a11cd21f48ff90febb"
                PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "errors"`);
    }

}
