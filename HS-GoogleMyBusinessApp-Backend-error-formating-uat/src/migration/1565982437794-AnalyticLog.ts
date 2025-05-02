import { MigrationInterface, QueryRunner } from 'typeorm';

export class AnalyticLog1565982437794 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE TABLE "analytics"
            (
                "id" SERIAL NOT NULL,
                "uid" character varying NOT NULL,
                "num_of_api_calls" integer NOT NULL DEFAULT 0,
                "num_of_replies" integer NOT NULL DEFAULT 0,
                "num_of_answers" integer NOT NULL DEFAULT 0,
                "num_of_posts" integer NOT NULL DEFAULT 0,
                "country_of_origin" character varying NOT NULL DEFAULT "NA",
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_d7faddd1fc4bcecf1a4555dbc5b"
                PRIMARY KEY ("id", "uid")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "analytics"`);
    }

}
