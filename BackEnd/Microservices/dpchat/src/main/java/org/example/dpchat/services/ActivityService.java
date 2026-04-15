package org.example.dpchat.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final UserLookupService userLookupService;
    
    // convId -> (userId -> lastTypingTimestamp)
    private final Map<String, Map<String, Long>> typingStatus = new ConcurrentHashMap<>();
    
    private static final long TYPING_TIMEOUT_MS = 5000; // 5 seconds

    public void recordTyping(String convId, String userId) {
        typingStatus.computeIfAbsent(convId, k -> new ConcurrentHashMap<>())
                   .put(userId, System.currentTimeMillis());
    }

    public List<UserLookupService.UserProfile> getTypingUsers(String convId) {
        Map<String, Long> users = typingStatus.get(convId);
        if (users == null) {
            return new ArrayList<>();
        }

        long now = System.currentTimeMillis();
        
        // Filter users who have typed recently
        List<String> activeUserIds = users.entrySet().stream()
                .filter(entry -> (now - entry.getValue()) < TYPING_TIMEOUT_MS)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // Cleanup: remove inactive users from the map to prevent memory leak
        users.entrySet().removeIf(entry -> (now - entry.getValue()) >= TYPING_TIMEOUT_MS);
        if (users.isEmpty()) {
            typingStatus.remove(convId);
        }

        return activeUserIds.stream()
                .map(userLookupService::lookupUser)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());
    }
}
