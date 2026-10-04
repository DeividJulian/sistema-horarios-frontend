export interface Classroom {
  id: number;
  nombre: string;
  aforo: number;
}

export type ClassroomInput = Omit<Classroom, 'id'>;
