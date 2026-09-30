// Registro dos posts animados. Para um novo post, crie video/posts/<id>.ts e adicione aqui.
import type { Post } from '../tipos';
import p01 from './01-apresentacao';
import p03 from './03-o-que-e-claude-code';

export const posts: Post[] = [p01, p03];
