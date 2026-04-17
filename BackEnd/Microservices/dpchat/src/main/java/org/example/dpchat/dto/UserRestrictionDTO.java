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
public class UserRestrictionDTO {
    private String type; // BAN, TIMEOUT
    private String reason;
    private LocalDateTime until; // Null for permanent
}
