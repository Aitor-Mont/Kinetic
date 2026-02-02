import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { SupabaseService } from '../../services/supabase.service';

interface Task {
    id: string;
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    points?: number;
    assignee?: { name: string; avatar: string };
    dueDate?: string;
    column_id?: string;
    position?: number;
}

interface Column {
    id: string;
    name: string;
    tasks: Task[];
    color: string;
    board_id?: string;
    position?: number;
}

@Component({
    selector: 'app-board',
    standalone: true,
    imports: [CommonModule, FormsModule, DragDropModule],
    templateUrl: './board.component.html',
    styleUrl: './board.component.css'
})
export class BoardComponent implements OnInit {
    boardId = '';
    boardName = signal('Loading...');
    columns = signal<Column[]>([]);
    showTaskModal = signal(false);
    editingTask = signal<Task | null>(null);
    selectedColumn = signal<Column | null>(null);

    // New task form
    newTask = {
        title: '',
        description: '',
        priority: 'MEDIUM' as Task['priority'],
        points: 0
    };

    constructor(private route: ActivatedRoute, private router: Router, private supabaseService: SupabaseService) { }

    async ngOnInit() {
        this.boardId = this.route.snapshot.params['id'];
        // Ideally fetch board details to set name, but for now just load columns
        await this.loadBoardData();
    }

    async loadBoardData() {
        // Fetch board details
        const { data: boardData, error: boardError } = await this.supabaseService.getBoard(this.boardId);
        if (boardError) {
            console.error('Error loading board:', boardError);
        } else if (boardData) {
            this.boardName.set((boardData as any).name);
        }

        const { data, error } = await this.supabaseService.getColumns(this.boardId);
        if (error) {
            console.error('Error loading board data:', error);
            return;
        }
        if (data) {
            // Transform data to match Column interface if needed, although Supabase returns tasks included
            const cols = data.map((col: any) => ({
                id: col.id,
                name: col.name,
                color: this.getColumnColor(col.name), // Helper to keep colors consistent if stored in DB or inferred
                tasks: col.tasks || [],
                board_id: col.board_id,
                position: col.position
            }));
            this.columns.set(cols);
        }
    }

    getColumnColor(name: string): string {
        switch (name.toLowerCase()) {
            case 'por hacer': return 'text-dark-400 border-dark-500';
            case 'en progreso': return 'text-kinetic-400 border-kinetic-500';
            case 'en revisión': return 'text-amber-400 border-amber-500';
            case 'completado': return 'text-emerald-400 border-emerald-500';
            default: return 'text-dark-400 border-dark-500';
        }
    }

    getColumnIds(): string[] {
        return this.columns().map(c => c.id);
    }

    async drop(event: CdkDragDrop<Task[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
            // Reorder within same column
            // For true persistence, we need to update positions of all affected items.
            // Simplified: Update the moved item's position based on index (assuming index maps roughly to position)
            // Real implementation often requires batch updates or linked list logic. 
            // For this scope, let's just update the moved item if possible or accept UI optimistic update.
            // Let's at least try updating the moved item's position if we can calculate it.
            const task = event.container.data[event.currentIndex];
            // Update supabase? 
            // Updating purely position in same column is tricky without updating others.
            // Skipping complex reorder logic to keep implementation simple as requested, but doing column change logic below.
        } else {
            const task = event.previousContainer.data[event.previousIndex];
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );

            // Update task column in Supabase
            // container.id is expected to be the column ID string (ensure HTML binds [id]="column.id")
            const newColumnId = event.container.id;

            // Calculate new position estimate (e.g. at end or start, simple approach)
            // Or just update column_id
            await this.supabaseService.moveTask(task.id, newColumnId, event.currentIndex); // Using index as simple position proxy
        }
    }

    getPriorityClass(priority: Task['priority']): string {
        switch (priority) {
            case 'LOW': return 'bg-dark-500 text-dark-200';
            case 'MEDIUM': return 'bg-kinetic-500/20 text-kinetic-400';
            case 'HIGH': return 'bg-amber-500/20 text-amber-400';
            case 'CRITICAL': return 'bg-red-500/20 text-red-400';
        }
    }

    getPriorityLabel(priority: Task['priority']): string {
        switch (priority) {
            case 'LOW': return 'Baja';
            case 'MEDIUM': return 'Media';
            case 'HIGH': return 'Alta';
            case 'CRITICAL': return 'Crítica';
        }
    }

    openNewTaskModal(column: Column) {
        this.selectedColumn.set(column);
        this.editingTask.set(null);
        this.resetTaskForm();
        this.showTaskModal.set(true);
    }

    openEditTaskModal(task: Task, column: Column) {
        this.selectedColumn.set(column);
        this.editingTask.set(task);
        this.newTask = {
            title: task.title,
            description: task.description,
            priority: task.priority,
            points: task.points || 0
        };
        this.showTaskModal.set(true);
    }

    closeTaskModal() {
        this.showTaskModal.set(false);
        this.resetTaskForm();
    }

    resetTaskForm() {
        this.newTask = {
            title: '',
            description: '',
            priority: 'MEDIUM',
            points: 0
        };
    }

    async saveTask() {
        const column = this.selectedColumn();
        if (!column) return;

        const editing = this.editingTask();

        if (editing) {
            // Update existing task
            const updates = {
                title: this.newTask.title,
                description: this.newTask.description,
                priority: this.newTask.priority,
                points: this.newTask.points
            };

            const { data, error } = await this.supabaseService.updateTask(editing.id, updates);

            if (!error && data) {
                // Optimistic UI update
                const taskIndex = column.tasks.findIndex(t => t.id === editing.id);
                if (taskIndex !== -1) {
                    column.tasks[taskIndex] = { ...editing, ...updates };
                }
            }
        } else {
            // Create new task
            const newTaskPayload = {
                column_id: column.id,
                title: this.newTask.title,
                description: this.newTask.description,
                priority: this.newTask.priority,
                points: this.newTask.points,
                // assignee_id: current user?
            };

            const { data, error } = await this.supabaseService.createTask(newTaskPayload);

            if (!error && data) {
                column.tasks.push(data as Task);
            }
        }

        this.closeTaskModal();
    }

    async deleteTask(task: Task, column: Column) {
        if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

        const { error } = await this.supabaseService.deleteTask(task.id);

        if (!error) {
            const index = column.tasks.findIndex(t => t.id === task.id);
            if (index !== -1) {
                column.tasks.splice(index, 1);
            }
        }
    }

    goBack() {
        this.router.navigate(['/dashboard']);
    }

    getTotalTasks(): number {
        return this.columns().reduce((sum, col) => sum + col.tasks.length, 0);
    }

    getCompletedTasks(): number {
        const doneColumn = this.columns().find(c => c.name === 'Completado');
        return doneColumn ? doneColumn.tasks.length : 0;
    }

    getProgress(): number {
        const total = this.getTotalTasks();
        if (total === 0) return 0;
        return Math.round((this.getCompletedTasks() / total) * 100);
    }
}
