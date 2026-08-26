import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { DepartmentEntity } from './department.orm-entity.js';
import { ProjectEntity } from './project.orm-entity.js';

@Entity('employees')
export class EmployeeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, name: 'current_position' })
  currentPosition!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  salary!: number;

  @Column({ type: 'uuid', name: 'department_id' })
  departmentId!: string;

  @ManyToOne(() => DepartmentEntity, (department) => department.employees)
  @JoinColumn({ name: 'department_id' })
  department!: DepartmentEntity;

  @ManyToMany(() => ProjectEntity, (project) => project.employees)
  projects!: ProjectEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
