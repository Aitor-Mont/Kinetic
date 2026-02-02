import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    // Auth Methods
    async signUp(email: string, password: string, fullName: string) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });
        return { data, error };
    }

    async signIn(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    }

    async signOut() {
        const { error } = await this.supabase.auth.signOut();
        return { error };
    }

    async resetPassword(email: string) {
        const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password', // Ensure this route exists or points to a valid handler
        });
        return { data, error };
    }

    async getUser(): Promise<User | null> {
        const { data: { user } } = await this.supabase.auth.getUser();
        return user;
    }

    // Data Methods

    // Projects
    async getProjects() {
        const { data, error } = await this.supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
        return { data, error };
    }

    async createProject(name: string, description: string, ownerId: string) {
        const { data, error } = await this.supabase
            .from('projects')
            .insert([{ name, description, owner_id: ownerId }])
            .select()
            .single();
        return { data, error };
    }

    // Boards
    async getBoards(projectId: string) {
        const { data, error } = await this.supabase
            .from('boards')
            .select('*')
            .eq('project_id', projectId)
            .order('position', { ascending: true });
        return { data, error };
    }

    async createBoard(name: string, projectId: string) {
        // Get max position
        const { data: maxPosData } = await this.supabase
            .from('boards')
            .select('position')
            .eq('project_id', projectId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const position = maxPosData ? maxPosData.position + 1 : 0;

        const { data, error } = await this.supabase
            .from('boards')
            .insert([{ name, project_id: projectId, position }])
            .select()
            .single();

        if (data && !error) {
            const boardId = data.id;
            const defaultColumns = [
                { name: 'Por Hacer', board_id: boardId, position: 0 },
                { name: 'En Progreso', board_id: boardId, position: 1 },
                { name: 'En Revisión', board_id: boardId, position: 2 },
                { name: 'Completado', board_id: boardId, position: 3 }
            ];
            await this.supabase.from('columns').insert(defaultColumns);
        }

        return { data, error };
    }

    async getBoard(boardId: string) {
        const { data, error } = await this.supabase
            .from('boards')
            .select('*')
            .eq('id', boardId)
            .single();
        return { data, error };
    }

    // Columns
    async getColumns(boardId: string) {
        const { data, error } = await this.supabase
            .from('columns')
            .select(`
        *,
        tasks (*)
      `)
            .eq('board_id', boardId)
            .order('position', { ascending: true });

        // Order tasks by position manually since we can't easily do it in the nested query in one go with JS client typing sometimes
        if (data) {
            data.forEach(col => {
                if (col.tasks) {
                    col.tasks.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
                }
            });
        }

        return { data, error };
    }

    // Tasks
    async createTask(task: any) {
        // Get max position in column
        const { data: maxPosData } = await this.supabase
            .from('tasks')
            .select('position')
            .eq('column_id', task.column_id)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const position = maxPosData ? maxPosData.position + 1 : 0;

        const { data, error } = await this.supabase
            .from('tasks')
            .insert([{ ...task, position }])
            .select()
            .single();
        return { data, error };
    }

    async updateTask(taskId: string, updates: any) {
        const { data, error } = await this.supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .select()
            .single();
        return { data, error };
    }

    async moveTask(taskId: string, newColumnId: string, newPosition: number) {
        const { data, error } = await this.supabase
            .from('tasks')
            .update({ column_id: newColumnId, position: newPosition })
            .eq('id', taskId)
            .select()
            .single();
        return { data, error };
    }

    async deleteTask(taskId: string) {
        const { error } = await this.supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);
        return { error };
    }
}
