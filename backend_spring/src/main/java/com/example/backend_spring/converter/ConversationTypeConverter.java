package com.example.backend_spring.converter;

import com.example.backend_spring.enums.ConversationType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ConversationTypeConverter implements AttributeConverter<ConversationType, String> {

    @Override
    public String convertToDatabaseColumn(ConversationType attribute) {
        if (attribute == null) return null;
        return attribute.name().toLowerCase();
    }

    @Override
    public ConversationType convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return ConversationType.valueOf(dbData.toUpperCase());
    }
}
