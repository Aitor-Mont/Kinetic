package com.kinetic.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "column_id")
    private UUID columnId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", insertable = false, updatable = false)
    private KanbanColumn column;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "assignee_id")
    private UUID assigneeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id", insertable = false, updatable = false)
    private User assignee;

    @Enumerated(EnumType.STRING)
    private Priority priority;

    private Integer points;

    @Column(name = "due_date")
    private OffsetDateTime dueDate;

    @Column(nullable = false)
    private Integer position;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    public enum Priority {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}
