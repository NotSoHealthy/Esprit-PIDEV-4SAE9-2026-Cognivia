package org.example.dpchat.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import javax.sql.DataSource;

/**
 * Only configures the secondary (care) datasource used by UserLookupService.
 * The primary datasource (dpchat DB) is left to Spring Boot auto-configuration
 * so that HikariCP picks up spring.datasource.url correctly.
 */
@Configuration
public class DataSourceConfig {

    @Bean(name = "careDataSource")
    @ConfigurationProperties(prefix = "care.datasource")
    public DataSource careDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean(name = "careJdbcTemplate")
    public NamedParameterJdbcTemplate careJdbcTemplate(@Qualifier("careDataSource") DataSource careDataSource) {
        return new NamedParameterJdbcTemplate(careDataSource);
    }
}
