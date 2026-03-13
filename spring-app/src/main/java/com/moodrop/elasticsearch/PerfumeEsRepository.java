package com.moodrop.elasticsearch;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface PerfumeEsRepository extends ElasticsearchRepository<PerfumeEsDocument, Integer> {
}
