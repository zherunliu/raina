export interface Session {
  id: string;
  username: string;
  title: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface SessionDto {
  id: string;
  title: string;
}
