package org.example.forumservice.services;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.forumservice.openFeign.CareClient;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserLookupService {

    private final CareClient careClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, UserProfile> userCache = new ConcurrentHashMap<>();

    @Getter
    @AllArgsConstructor
    public static class UserProfile {
        public String fullName;
        public String role;
    }

    public Optional<UserProfile> lookupUser(String userId) {
        if (userId == null)
            return Optional.empty();

        String normalizedId = userId.trim().toLowerCase();
        log.debug("Looking up user profile for userId: {}", normalizedId);

        if (userCache.containsKey(normalizedId)) {
            return Optional.of(userCache.get(normalizedId));
        }

        try {
            UUID uuid = UUID.fromString(normalizedId);

            // Try Doctor
            try {
                log.info("Querying care-service for Doctor with userId: {}", uuid);
                String docString = careClient.getDoctorByUserId(uuid);
                if (docString != null && !docString.isBlank()) {
                    JsonNode doc = objectMapper.readTree(docString);
                    log.info("Received Doctor response for {}: {}", uuid, docString);
                    String firstName = extractFieldNode(doc, "firstName", "first_name");
                    String lastName = extractFieldNode(doc, "lastName", "last_name");
                    
                    if (firstName != null) {
                        String fullName = (firstName + " " + (lastName != null ? lastName : "")).trim();
                        UserProfile profile = new UserProfile(fullName, "Doctor");
                        userCache.put(normalizedId, profile);
                        log.info("Successfully identified Doctor: {} for userId: {}", fullName, normalizedId);
                        return Optional.of(profile);
                    }
                } else {
                    log.debug("Empty or null response for Doctor lookup: {}", normalizedId);
                }
            } catch (Exception e) {
                log.info("Doctor lookup failed for {}: {}", normalizedId, e.getMessage());
            }

            // Try Caregiver
            try {
                log.info("Querying care-service for Caregiver with userId: {}", uuid);
                String cgString = careClient.getCaregiverByUserId(uuid);
                if (cgString != null && !cgString.isBlank()) {
                    JsonNode cg = objectMapper.readTree(cgString);
                    log.info("Received Caregiver response for {}: {}", uuid, cgString);
                    String firstName = extractFieldNode(cg, "firstName", "first_name");
                    String lastName = extractFieldNode(cg, "lastName", "last_name");
                    
                    if (firstName != null) {
                        String fullName = (firstName + " " + (lastName != null ? lastName : "")).trim();
                        UserProfile profile = new UserProfile(fullName, "Caregiver");
                        userCache.put(normalizedId, profile);
                        log.info("Successfully identified Caregiver: {} for userId: {}", fullName, normalizedId);
                        return Optional.of(profile);
                    }
                }
            } catch (Exception e) {
                log.info("Caregiver lookup failed for {}: {}", normalizedId, e.getMessage());
            }

            // Try Patient
            try {
                log.info("Querying care-service for Patient with userId: {}", uuid);
                String ptString = careClient.getPatientByUserId(uuid);
                if (ptString != null && !ptString.isBlank()) {
                    JsonNode pt = objectMapper.readTree(ptString);
                    log.info("Received Patient response for {}: {}", uuid, ptString);
                    String firstName = extractFieldNode(pt, "firstName", "first_name");
                    String lastName = extractFieldNode(pt, "lastName", "last_name");
                    
                    if (firstName != null) {
                        String fullName = (firstName + " " + (lastName != null ? lastName : "")).trim();
                        UserProfile profile = new UserProfile(fullName, "Patient");
                        userCache.put(normalizedId, profile);
                        log.info("Successfully identified Patient: {} for userId: {}", fullName, normalizedId);
                        return Optional.of(profile);
                    }
                }
            } catch (Exception e) {
                log.info("Patient lookup failed for {}: {}", normalizedId, e.getMessage());
            }

        } catch (IllegalArgumentException e) {
            log.warn("Invalid UUID format for userId: {}", normalizedId);
        } catch (Exception e) {
            log.error("Unexpected error looking up user info for {}: {}", normalizedId, e.getMessage(), e);
        }

        return Optional.empty();
    }

    private String extractFieldNode(JsonNode node, String... keys) {
        if (node == null || node.isMissingNode()) return null;
        for (String key : keys) {
            JsonNode v = node.get(key);
            if (v != null && !v.isNull() && !v.asText().trim().isEmpty()) {
                return v.asText();
            }
        }
        return null;
    }
}
