export interface StudentGroup {
  id: number;
  nombre: string;
  num_estudiantes: number;
}

export type StudentGroupInput = Omit<StudentGroup, 'id'>;
