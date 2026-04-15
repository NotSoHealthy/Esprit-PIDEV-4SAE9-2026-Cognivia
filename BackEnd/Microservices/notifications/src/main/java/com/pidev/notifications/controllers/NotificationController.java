package com.pidev.notifications.controllers;

import com.pidev.notifications.dto.VisitDto;
import com.pidev.notifications.entities.Notification;
import com.pidev.notifications.entities.RecipientType;
import com.pidev.notifications.openFeign.CareClient;
import com.pidev.notifications.services.NotificationService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@RestController
@RequestMapping("/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public List<Notification> getNotifications() {
        return notificationService.getAllNotifications();
    }

    @GetMapping("/{id}")
    public Notification getNotificationById(@PathVariable UUID id) {
        return notificationService.getNotificationById(id);
    }

    @GetMapping("/recipient/{recipientType}/{id}")
    public List<Notification> getRecipientNotifications(@PathVariable long id, @PathVariable RecipientType recipientType) {
        return notificationService.getByRecipientId(id, recipientType);
    }

    @GetMapping("/pharmacy/{id}")
    public List<Notification> getPharmacyNotifications(@PathVariable long id) {
        return notificationService.getByRecipientId(id, RecipientType.PHARMACY);
    }

    @PostMapping
    public Notification createNotification(@RequestBody  Notification notification) {
        return notificationService.saveNotification(notification);
    }

    @PutMapping("/{id}")
    public Notification updateNotification(@PathVariable UUID id, @RequestBody Notification notification) {
        return notificationService.updateNotification(id, notification);
    }

    @PutMapping("/mark-as-read/{id}")
    public Notification markAsRead(@PathVariable UUID id) {
        return notificationService.markNotificationAsRead(id);
    }

    @PutMapping("/mark-as-seen/{id}")
    public Notification markAsSeen(@PathVariable UUID id) {
        return notificationService.markNotificationAsSeen(id);
    }

    @DeleteMapping("/{id}")
    public void deleteNotification(@PathVariable UUID id) {
        notificationService.deleteNotification(id);
    }
}
