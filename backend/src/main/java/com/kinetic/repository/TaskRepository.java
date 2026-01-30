package com.kinetic.repository;

import com.kinetic.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByColumnIdOrderByPositionAsc(UUID columnId);

    List<Task> findByAssigneeId(UUID assigneeId);
}
