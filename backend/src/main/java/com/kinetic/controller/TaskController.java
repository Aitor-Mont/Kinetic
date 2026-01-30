package com.kinetic.controller;

import com.kinetic.entity.Task;
import com.kinetic.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class TaskController {

    private final TaskRepository taskRepository;

    @GetMapping("/column/{columnId}")
    public List<Task> getTasksByColumn(@PathVariable @NonNull UUID columnId) {
        return taskRepository.findByColumnIdOrderByPositionAsc(columnId);
    }

    @GetMapping("/assignee/{assigneeId}")
    public List<Task> getTasksByAssignee(@PathVariable @NonNull UUID assigneeId) {
        return taskRepository.findByAssigneeId(assigneeId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTask(@PathVariable @NonNull UUID id) {
        return taskRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        task.setCreatedAt(OffsetDateTime.now());
        return taskRepository.save(task);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable @NonNull UUID id, @RequestBody Task taskDetails) {
        return taskRepository.findById(id)
                .map((@NonNull Task task) -> {
                    task.setTitle(taskDetails.getTitle());
                    task.setDescription(taskDetails.getDescription());
                    task.setPriority(taskDetails.getPriority());
                    task.setPoints(taskDetails.getPoints());
                    task.setDueDate(taskDetails.getDueDate());
                    task.setAssigneeId(taskDetails.getAssigneeId());
                    return ResponseEntity.ok(taskRepository.save(task));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/move")
    public ResponseEntity<Task> moveTask(
            @PathVariable @NonNull UUID id,
            @RequestBody MoveTaskRequest request) {
        return taskRepository.findById(id)
                .map((@NonNull Task task) -> {
                    task.setColumnId(request.columnId());
                    task.setPosition(request.position());
                    return ResponseEntity.ok(taskRepository.save(task));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable @NonNull UUID id) {
        return taskRepository.findById(id)
                .map(task -> {
                    taskRepository.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    public record MoveTaskRequest(@NonNull UUID columnId, Integer position) {
    }
}
