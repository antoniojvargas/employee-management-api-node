export interface Employee {
  id: string;
  name: string;
  currentPosition: string;
  salary: number;
  departmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
