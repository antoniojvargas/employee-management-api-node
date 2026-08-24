import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNewQuestionsSystem20260824000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE new_questions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        position integer NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE new_selections (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id uuid NOT NULL REFERENCES new_questions (id) ON DELETE CASCADE,
        value text NOT NULL,
        position integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_new_selections_question_id ON new_selections (question_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE new_translations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_table varchar(64) NOT NULL CHECK (entity_table IN ('new_questions', 'new_selections')),
        entity_id uuid NOT NULL,
        locale varchar(10) NOT NULL,
        text text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_new_translations_entity_locale UNIQUE (entity_table, entity_id, locale)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_new_translations_entity ON new_translations (entity_table, entity_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE new_user_responses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        question_id uuid NOT NULL REFERENCES new_questions (id) ON DELETE RESTRICT,
        selection_id uuid REFERENCES new_selections (id) ON DELETE RESTRICT,
        value text,
        is_custom boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_new_user_responses_target_exclusive
          CHECK ((selection_id IS NOT NULL) != (value IS NOT NULL)),
        CONSTRAINT chk_new_user_responses_custom_without_selection
          CHECK (NOT is_custom OR selection_id IS NULL)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_new_user_responses_user_id ON new_user_responses (user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_new_user_responses_question_id ON new_user_responses (question_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_new_user_responses_selection_id ON new_user_responses (selection_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS new_user_responses`);
    await queryRunner.query(`DROP TABLE IF EXISTS new_translations`);
    await queryRunner.query(`DROP TABLE IF EXISTS new_selections`);
    await queryRunner.query(`DROP TABLE IF EXISTS new_questions`);
  }
}
