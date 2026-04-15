export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  password: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface UserVo {
  id: number;
  name: string;
  email: string;
  username: string;
  created_at?: Date;
  updated_at?: Date;
}

export type UserWithPassword = User;

export interface UserInsertDto {
  name: string;
  email: string;
  username: string;
  password: string;
}
