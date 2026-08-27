import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { DepartmentEntity } from './department.orm-entity.js';
import { PositionHistoryEntity } from './position-history.orm-entity.js';
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

  @Index()
  @Column({ type: 'uuid', name: 'department_id', nullable: true })
  departmentId!: string | null;

  // SET NULL: al eliminar un departamento, los empleados quedan sin asignación
  // en vez de cascade. Permite reasignar manualmente antes de borrar definitivamente.
  @ManyToOne(() => DepartmentEntity, (department) => department.employees, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'department_id' })
  department!: DepartmentEntity | null;

  @ManyToMany(() => ProjectEntity, (project) => project.employees)
  projects!: ProjectEntity[];

  @OneToMany(() => PositionHistoryEntity, (history) => history.employee)
  positionHistory!: PositionHistoryEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
