import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDomainEntities20260826000000 implements MigrationInterface {
  name = 'CreateDomainEntities20260826000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "position_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "employee_id" uuid NOT NULL, "position" character varying(255) NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a00ccfa0f04dec40b64bc2c795f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a6fd2cf9f5d0e79a05a2ae67c7" ON "position_history" ("employee_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "current_position" character varying(255) NOT NULL, "salary" numeric(10,2) NOT NULL, "department_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_678a3540f843823784b0fe4a4f" ON "employees" ("department_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "departments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_839517a681a86bb84cbcc6a1e9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_projects" ("projectsId" uuid NOT NULL, "employeesId" uuid NOT NULL, CONSTRAINT "PK_7ba6b6c58f12840c695f8591591" PRIMARY KEY ("projectsId", "employeesId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e1e40bcc8b98bf014953e87f53" ON "employee_projects" ("projectsId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0e4f579cd84295044f16058174" ON "employee_projects" ("employeesId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "position_history" ADD CONSTRAINT "FK_a6fd2cf9f5d0e79a05a2ae67c7c" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD CONSTRAINT "FK_678a3540f843823784b0fe4a4f2" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_projects" ADD CONSTRAINT "FK_e1e40bcc8b98bf014953e87f532" FOREIGN KEY ("projectsId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_projects" ADD CONSTRAINT "FK_0e4f579cd84295044f160581747" FOREIGN KEY ("employeesId") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_projects" DROP CONSTRAINT "FK_0e4f579cd84295044f160581747"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_projects" DROP CONSTRAINT "FK_e1e40bcc8b98bf014953e87f532"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" DROP CONSTRAINT "FK_678a3540f843823784b0fe4a4f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "position_history" DROP CONSTRAINT "FK_a6fd2cf9f5d0e79a05a2ae67c7c"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_0e4f579cd84295044f16058174"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e1e40bcc8b98bf014953e87f53"`);
    await queryRunner.query(`DROP TABLE "employee_projects"`);
    await queryRunner.query(`DROP TABLE "departments"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_678a3540f843823784b0fe4a4f"`);
    await queryRunner.query(`DROP TABLE "employees"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a6fd2cf9f5d0e79a05a2ae67c7"`);
    await queryRunner.query(`DROP TABLE "position_history"`);
  }
}
