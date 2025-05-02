import { MigrationInterface, QueryRunner } from 'typeorm';

export class Notification1565885731118 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE TABLE "notification"
            (
                "single_row_id" boolean NOT NULL DEFAULT true,
                "text" character varying NOT NULL,
                "type" character varying NOT NULL,
                "streams" text array NOT NULL,
                "expiry" TIMESTAMP NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "CHK_62f31b63939e83855e545931a0"
                CHECK (single_row_id = TRUE),
                CONSTRAINT "PK_00b5828e094e2d765de666ff9e9"
                PRIMARY KEY ("single_row_id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "notification"`);
    }

}
