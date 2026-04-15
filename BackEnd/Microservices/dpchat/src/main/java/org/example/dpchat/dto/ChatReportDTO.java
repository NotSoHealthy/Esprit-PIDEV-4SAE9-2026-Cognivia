package org.example.dpchat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatReportDTO {
    private Long id;
    private String reporterId;
    private String reporterName;
    private String reportedUserId;
    private String reportedUserName;
    private Long groupId;
    private String groupName;
    private Long messageId;
    private String reason;
    private LocalDateTime timestamp;
    private String status;
}
