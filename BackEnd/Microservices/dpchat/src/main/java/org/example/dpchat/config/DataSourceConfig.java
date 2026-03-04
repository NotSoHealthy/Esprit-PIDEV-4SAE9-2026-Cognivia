package org.example.dpchat.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import javax.sql.DataSource;

/**
 * Configures both the primary (dpchat) and secondary (care) datasources.
 * Marking dpchat as @Primary ensures JPA uses it by default.
 */
@Configuration
public class DataSourceConfig {

    @Primary
    @Bean(name = "dataSource")
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSource dataSource() {
        return DataSourceBuilder.create().build();
    }

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
