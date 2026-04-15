package org.example.forumservice.openFeign;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

@Data
public class CareUserDto {
    @JsonAlias({"firstName", "first_name"})
    private String firstName;
    
    @JsonAlias({"lastName", "last_name"})
    private String lastName;
}
