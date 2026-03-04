package org.example.dpchat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.dpchat.entities.Message;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatSummaryDTO {
    private String contactId;
    private long unreadCount;
    private Message lastMessage;
}
