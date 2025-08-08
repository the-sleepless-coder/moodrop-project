package com.moodrop.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.moodrop.model.dao")
public class DBConfig {

}
