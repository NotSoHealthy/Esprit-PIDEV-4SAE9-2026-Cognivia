package org.example.dpchat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GroupMemberInfoDTO {
    private String userId;
    private boolean isAdmin;
}
