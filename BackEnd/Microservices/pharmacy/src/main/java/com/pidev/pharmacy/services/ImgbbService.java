package com.pidev.pharmacy.services;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class ImgbbService {

    @Value("${imgbb.apiKey}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private static final String IMGBB_API_URL = "https://api.imgbb.com/1/upload";

    public ImgbbService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String uploadImage(String imageBase64) {
        try {
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("image", imageBase64);
            body.add("key", apiKey);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ImgbbResponse response = restTemplate.postForObject(IMGBB_API_URL, request, ImgbbResponse.class);

            if (response != null && response.isSuccess() && response.getData() != null) {
                String url = response.getData().getUrl();
                log.info("Image uploaded successfully. URL: {}", url);
                return url;
            }
            throw new RuntimeException("Failed to upload image to imgbb");
        } catch (Exception e) {
            log.error("Error uploading image to imgbb", e);
            throw new RuntimeException("Error uploading image: " + e.getMessage(), e);
        }
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ImgbbResponse {
        private boolean success;
        private ImgbbData data;
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ImgbbData {
        private String url;
    }
}

