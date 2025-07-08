export interface User {
  id: string;
  email: string;
  username: string;
  bio: string;
  image: string;
  token?: string;
}

export interface Author {
  username: string;
  bio: string;
  image: string;
  following: boolean;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: Author;
}

export interface Comment {
  id: string;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: Author;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}