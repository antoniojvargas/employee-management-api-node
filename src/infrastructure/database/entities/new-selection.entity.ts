import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NewQuestionEntity } from './new-question.entity.js';

@Entity('new_selections')
@Index('idx_new_selections_question_id', ['questionId'])
export class NewSelectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'question_id' })
  questionId!: string;

  @ManyToOne(() => NewQuestionEntity, (question) => question.selections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question!: NewQuestionEntity;

  @Column({ type: 'text' })
  value!: string;

  @Column({ type: 'integer', default: 0 })
  position!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
