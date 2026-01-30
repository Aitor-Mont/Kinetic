import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
}

interface Board {
    id: string;
    name: string;
    projectId: string;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
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

    // Demo data
    demoProjects: Project[] = [
        { id: '1', name: 'Proyecto Alpha', description: 'Desarrollo de nueva plataforma', createdAt: new Date().toISOString() },
        { id: '2', name: 'Marketing Q1', description: 'Campañas de marketing primer trimestre', createdAt: new Date().toISOString() },
        { id: '3', name: 'Producto Beta', description: 'Lanzamiento producto beta', createdAt: new Date().toISOString() },
    ];

    demoBoards: Board[] = [
        { id: '1', name: 'Sprint 1', projectId: '1' },
        { id: '2', name: 'Backlog', projectId: '1' },
        { id: '3', name: 'Campañas Digitales', projectId: '2' },
    ];

    constructor(private router: Router, private http: HttpClient) { }

    ngOnInit() {
        // Load demo data for now
        this.projects.set(this.demoProjects);
        this.boards.set(this.demoBoards);
        if (this.demoProjects.length > 0) {
            this.selectedProject.set(this.demoProjects[0]);
        }
    }

    selectProject(project: Project) {
        this.selectedProject.set(project);
    }

    getProjectBoards() {
        const selected = this.selectedProject();
        if (!selected) return [];
        return this.boards().filter(b => b.projectId === selected.id);
    }

    openBoard(board: Board) {
        this.router.navigate(['/board', board.id]);
    }

    toggleSidebar() {
        this.sidebarCollapsed.update(v => !v);
    }

    logout() {
        this.router.navigate(['/']);
    }
}
