package org.example.dpchat.controllers;

import lombok.RequiredArgsConstructor;
import org.example.dpchat.services.ActivityService;
import org.example.dpchat.services.UserLookupService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chat/activity")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping("/typing/{convId}")
    public void recordTyping(@PathVariable String convId, @RequestParam String userId) {
        activityService.recordTyping(convId, userId);
    }

    @GetMapping("/status/{convId}")
    public List<UserLookupService.UserProfile> getTypingStatus(@PathVariable String convId) {
        return activityService.getTypingUsers(convId);
    }
}
