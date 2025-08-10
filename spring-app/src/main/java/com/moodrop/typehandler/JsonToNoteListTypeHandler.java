package com.moodrop.typehandler;

import java.io.IOException;
import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collections;
import java.util.List;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedJdbcTypes;
import org.apache.ibatis.type.MappedTypes;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moodrop.model.dto.NotesDto;

@MappedJdbcTypes(JdbcType.VARCHAR)      // 드라이버가 JSON을 문자열로 넘기는 경우가 많음
@MappedTypes(List.class)
public class JsonToNoteListTypeHandler extends BaseTypeHandler<List<NotesDto>> {
    private static final ObjectMapper M = new ObjectMapper();
    private static final TypeReference<List<NotesDto>> T = new TypeReference<>() {};

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, List<NotesDto> parameter, JdbcType jdbcType) throws SQLException {
        try { ps.setString(i, M.writeValueAsString(parameter)); }
        catch (IOException e) { throw new SQLException("JSON write error", e); }
    }
    @Override public List<NotesDto> getNullableResult(ResultSet rs, String columnName) throws SQLException { return parse(rs.getString(columnName)); }
    @Override public List<NotesDto> getNullableResult(ResultSet rs, int columnIndex) throws SQLException { return parse(rs.getString(columnIndex)); }
    @Override public List<NotesDto> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException { return parse(cs.getString(columnIndex)); }

    private List<NotesDto> parse(String s) {
        try {
            if (s == null || s.isBlank() || "null".equalsIgnoreCase(s) || "[null]".equalsIgnoreCase(s)) return Collections.emptyList();
            return M.readValue(s, T);
        } catch (Exception e) {
            return Collections.emptyList(); // 안전하게 빈 리스트
        }
    }
}
