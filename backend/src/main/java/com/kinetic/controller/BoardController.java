package com.kinetic.controller;

import com.kinetic.entity.Board;
import com.kinetic.entity.KanbanColumn;
import com.kinetic.entity.Task;
import com.kinetic.repository.BoardRepository;
import com.kinetic.repository.ColumnRepository;
import com.kinetic.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class BoardController {

    private final BoardRepository boardRepository;
    private final ColumnRepository columnRepository;
    private final TaskRepository taskRepository;

    @GetMapping("/project/{projectId}")
    public List<Board> getBoardsByProject(@PathVariable @NonNull UUID projectId) {
        return boardRepository.findByProjectId(projectId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Board> getBoard(@PathVariable @NonNull UUID id) {
        return boardRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/full")
    public ResponseEntity<Map<String, Object>> getBoardWithData(@PathVariable @NonNull UUID id) {
        return boardRepository.findById(id)
                .map(board -> {
                    List<KanbanColumn> columns = columnRepository.findByBoardIdOrderByPositionAsc(id);
                    Map<UUID, List<Task>> tasksByColumn = columns.stream()
                            .collect(Collectors.toMap(
                                    KanbanColumn::getId,
                                    col -> taskRepository.findByColumnIdOrderByPositionAsc(col.getId())));

                    return ResponseEntity.ok(Map.of(
                            "board", board,
                            "columns", columns,
                            "tasks", tasksByColumn));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Board createBoard(@RequestBody Board board) {
        board.setCreatedAt(OffsetDateTime.now());
        Board savedBoard = boardRepository.save(board);

        // Create default columns
        String[] defaultColumns = { "To Do", "In Progress", "Review", "Done" };
        for (int i = 0; i < defaultColumns.length; i++) {
            KanbanColumn column = new KanbanColumn();
            column.setBoardId(savedBoard.getId());
            column.setName(defaultColumns[i]);
            column.setPosition(i);
            column.setCreatedAt(OffsetDateTime.now());
            columnRepository.save(column);
        }

        return savedBoard;
    }

    @PutMapping("/{id}")
    public ResponseEntity<Board> updateBoard(@PathVariable @NonNull UUID id, @RequestBody Board boardDetails) {
        return boardRepository.findById(id)
                .map((@NonNull Board board) -> {
                    board.setName(boardDetails.getName());
                    board.setColumnOrder(boardDetails.getColumnOrder());
                    return ResponseEntity.ok(boardRepository.save(board));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoard(@PathVariable @NonNull UUID id) {
        return boardRepository.findById(id)
                .map(board -> {
                    boardRepository.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
