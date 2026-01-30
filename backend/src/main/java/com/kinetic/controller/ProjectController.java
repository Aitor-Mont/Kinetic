package com.kinetic.controller;

import com.kinetic.entity.Project;
import com.kinetic.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ProjectController {

    private final ProjectRepository projectRepository;

    @GetMapping
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProject(@PathVariable @NonNull UUID id) {
        return projectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/owner/{ownerId}")
    public List<Project> getProjectsByOwner(@PathVariable @NonNull UUID ownerId) {
        return projectRepository.findByOwnerId(ownerId);
    }

    @PostMapping
    public Project createProject(@RequestBody Project project) {
        project.setCreatedAt(OffsetDateTime.now());
        return projectRepository.save(project);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(@PathVariable @NonNull UUID id, @RequestBody Project projectDetails) {
        return projectRepository.findById(id)
                .map((@NonNull Project project) -> {
                    project.setName(projectDetails.getName());
                    project.setDescription(projectDetails.getDescription());
                    return ResponseEntity.ok(projectRepository.save(project));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable @NonNull UUID id) {
        return projectRepository.findById(id)
                .map(project -> {
                    projectRepository.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
