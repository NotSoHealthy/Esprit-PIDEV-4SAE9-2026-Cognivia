package org.example.dpchat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class DPchatApplication {

    public static void main(String[] args) {
        SpringApplication.run(DPchatApplication.class, args);
    }
}
