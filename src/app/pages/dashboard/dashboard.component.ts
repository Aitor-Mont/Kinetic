import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SupabaseService } from '../../services/supabase.service';
import { FormsModule } from '@angular/forms';

interface Project {
    id: string;
    name: string;
    description: string;
    created_at: string;
    owner_id: string;
}

interface Board {
    id: string;
    name: string;
    project_id: string;
    position: number;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
    projects = signal<Project[]>([]);
    boards = signal<Board[]>([]);
    selectedProject = signal<Project | null>(null);
    showNewProjectModal = signal(false);
    showNewBoardModal = signal(false);
    sidebarCollapsed = signal(false);
    currentUser = signal<any>(null);

    // Form data
    newProject = { name: '', description: '' };
    newBoard = { name: '' };
    isLoading = signal(false);

    constructor(private router: Router, private http: HttpClient, private supabaseService: SupabaseService) { }

    async ngOnInit() {
        const user = await this.supabaseService.getUser();
        if (!user) {
            this.router.navigate(['/']);
            return;
        }
        this.currentUser.set(user);
        await this.loadProjects();
    }

    async loadProjects() {
        const { data, error } = await this.supabaseService.getProjects();
        if (error) {
            console.error('Error loading projects:', error);
            return;
        }
        if (data) {
            this.projects.set(data as any);
            if (data.length > 0 && !this.selectedProject()) {
                this.selectProject(data[0] as any);
            }
        }
    }

    async selectProject(project: Project) {
        this.selectedProject.set(project);
        await this.loadBoards(project.id);
    }

    async loadBoards(projectId: string) {
        const { data, error } = await this.supabaseService.getBoards(projectId);
        if (error) {
            console.error('Error loading boards:', error);
            return;
        }
        if (data) {
            this.boards.set(data as any);
        }
    }

    getProjectBoards() {
        const selected = this.selectedProject();
        if (!selected) return [];
        return this.boards().filter(b => b.project_id === selected.id);
    }

    openBoard(board: Board) {
        this.router.navigate(['/board', board.id]);
    }

    toggleSidebar() {
        this.sidebarCollapsed.update(v => !v);
    }

    async logout() {
        await this.supabaseService.signOut();
        this.router.navigate(['/']);
    }

    // Project Modal
    openNewProjectModal() {
        this.newProject = { name: '', description: '' };
        this.showNewProjectModal.set(true);
    }

    closeNewProjectModal() {
        this.showNewProjectModal.set(false);
    }

    async createProject() {
        if (!this.newProject.name) return;
        this.isLoading.set(true);
        const { data, error } = await this.supabaseService.createProject(
            this.newProject.name,
            this.newProject.description,
            this.currentUser().id
        );
        this.isLoading.set(false);

        if (error) {
            alert('Error creating project');
            console.error(error);
        } else if (data) {
            await this.loadProjects();
            this.selectProject(data as any);
            this.closeNewProjectModal();
        }
    }

    // Board Modal
    openNewBoardModal() {
        const project = this.selectedProject();
        if (!project) return;
        this.newBoard = { name: '' };
        this.showNewBoardModal.set(true);
    }

    closeNewBoardModal() {
        this.showNewBoardModal.set(false);
    }

    async createBoard() {
        const project = this.selectedProject();
        if (!project || !this.newBoard.name) return;

        this.isLoading.set(true);
        const { data, error } = await this.supabaseService.createBoard(
            this.newBoard.name,
            project.id
        );
        this.isLoading.set(false);

        if (error) {
            alert('Error creating board');
            console.error(error);
        } else if (data) {
            await this.loadBoards(project.id);
            this.closeNewBoardModal();
        }
    }
}
