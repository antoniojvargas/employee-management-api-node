import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { NewQuestionEntity } from './new-question.entity'
import { NewSelectionEntity } from './new-selection.entity'

@Entity('new_user_responses')
@Index('idx_new_user_responses_user_id', ['userId'])
@Index('idx_new_user_responses_question_id', ['questionId'])
@Index('idx_new_user_responses_selection_id', ['selectionId'])
export class NewUserResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string

  @Column({ type: 'uuid', name: 'question_id' })
  questionId!: string

  @Column({ type: 'uuid', name: 'selection_id', nullable: true })
  selectionId!: string | null

  @ManyToOne(() => NewQuestionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'question_id' })
  question!: NewQuestionEntity

  @ManyToOne(() => NewSelectionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'selection_id' })
  selection!: NewSelectionEntity | null

  @Column({ type: 'text', nullable: true })
  value!: string | null

  @Column({ type: 'boolean', default: false, name: 'is_custom' })
  isCustom!: boolean

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date
}
