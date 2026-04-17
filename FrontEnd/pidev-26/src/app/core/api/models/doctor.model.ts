export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  speciality: string;
}

export interface Patient {
  id: number;
  firstName?: string;
  lastName?: string;
}
