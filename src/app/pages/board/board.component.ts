import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

interface Task {
    id: string;
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    points?: number;
    assignee?: { name: string; avatar: string };
    dueDate?: string;
}

interface Column {
    id: string;
    name: string;
    tasks: Task[];
    color: string;
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
    boardName = signal('Sprint 1');
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

    // Demo data
    demoColumns: Column[] = [
        {
            id: '1',
            name: 'Por Hacer',
            color: 'text-dark-400 border-dark-500',
            tasks: [
                { id: '1', title: 'Diseñar nueva landing page', description: 'Crear mockups para la nueva landing', priority: 'HIGH', points: 5, assignee: { name: 'Ana G.', avatar: 'A' } },
                { id: '2', title: 'Configurar CI/CD', description: 'Pipeline de integración continua', priority: 'MEDIUM', points: 8 },
                { id: '3', title: 'Documentar API', description: 'Swagger/OpenAPI specs', priority: 'LOW', points: 3, assignee: { name: 'Carlos M.', avatar: 'C' } },
            ]
        },
        {
            id: '2',
            name: 'En Progreso',
            color: 'text-kinetic-400 border-kinetic-500',
            tasks: [
                { id: '4', title: 'Implementar autenticación', description: 'JWT + Refresh tokens', priority: 'CRITICAL', points: 13, assignee: { name: 'Luis R.', avatar: 'L' }, dueDate: '2026-02-01' },
                { id: '5', title: 'Tests unitarios', description: 'Cobertura mínima 80%', priority: 'HIGH', points: 8, assignee: { name: 'María P.', avatar: 'M' } },
            ]
        },
        {
            id: '3',
            name: 'En Revisión',
            color: 'text-amber-400 border-amber-500',
            tasks: [
                { id: '6', title: 'Optimizar queries', description: 'N+1 y caché Redis', priority: 'MEDIUM', points: 5, assignee: { name: 'Pablo S.', avatar: 'P' } },
            ]
        },
        {
            id: '4',
            name: 'Completado',
            color: 'text-emerald-400 border-emerald-500',
            tasks: [
                { id: '7', title: 'Setup proyecto Angular', description: 'Estructura inicial', priority: 'MEDIUM', points: 2, assignee: { name: 'Ana G.', avatar: 'A' } },
                { id: '8', title: 'Definir esquema DB', description: 'PostgreSQL + Supabase', priority: 'HIGH', points: 3, assignee: { name: 'Luis R.', avatar: 'L' } },
            ]
        }
    ];

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit() {
        this.boardId = this.route.snapshot.params['id'];
        this.columns.set(this.demoColumns);
    }

    getColumnIds(): string[] {
        return this.columns().map(c => c.id);
    }

    drop(event: CdkDragDrop<Task[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
        }
        // Here you would call the API to persist the change
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

    saveTask() {
        const column = this.selectedColumn();
        if (!column) return;

        const editing = this.editingTask();

        if (editing) {
            // Update existing task
            const taskIndex = column.tasks.findIndex(t => t.id === editing.id);
            if (taskIndex !== -1) {
                column.tasks[taskIndex] = {
                    ...editing,
                    title: this.newTask.title,
                    description: this.newTask.description,
                    priority: this.newTask.priority,
                    points: this.newTask.points
                };
            }
        } else {
            // Create new task
            const newTask: Task = {
                id: Date.now().toString(),
                title: this.newTask.title,
                description: this.newTask.description,
                priority: this.newTask.priority,
                points: this.newTask.points
            };
            column.tasks.push(newTask);
        }

        this.closeTaskModal();
    }

    deleteTask(task: Task, column: Column) {
        const index = column.tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
            column.tasks.splice(index, 1);
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
