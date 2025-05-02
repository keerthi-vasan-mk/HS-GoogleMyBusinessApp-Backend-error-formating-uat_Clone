import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';

export class AdminUser1567889929162 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`
            CREATE TABLE "admin"
            (
                "id" SERIAL NOT NULL,
                "username" character varying NOT NULL,
                "password" character varying NOT NULL,
                "analytics_only" BOOLEAN NOT NULL DEFAULT TRUE,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_7f757431323be2f3e09b4f37214"
                PRIMARY KEY ("id", "username")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "admin"
            (
                username,
                password,
                analytics_only
            )
            VALUES
            (
                'hsadmin',
                '${await bcrypt.hash('iamanowl', 10)}',
                FALSE
            );
        `);
        await queryRunner.query(`
            INSERT INTO "admin"
            (
                username,
                password,
                analytics_only
            )
            VALUES
            (
                'hsanalytics',
                '${await bcrypt.hash('Owl-lytics', 10)}',
                TRUE
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "admin"`);
    }

}
