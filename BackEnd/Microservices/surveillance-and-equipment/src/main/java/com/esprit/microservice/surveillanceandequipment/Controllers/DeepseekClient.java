package com.esprit.microservice.surveillanceandequipment.Controllers;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "pharmacy", url = "http://localhost:8091") // replace port
public interface DeepseekClient {

    @GetMapping("/ai/medications/askDeepSeek")
    String askDeepSeek(
            @RequestParam String systemPrompt,
            @RequestParam String userPrompt
    );
}
