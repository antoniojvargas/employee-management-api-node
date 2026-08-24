import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { NewSelectionEntity } from './new-selection.entity.js'

@Entity('new_questions')
export class NewQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'integer', default: 0 })
  position!: number

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @OneToMany(() => NewSelectionEntity, (selection) => selection.question)
  selections!: NewSelectionEntity[]

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date
}
