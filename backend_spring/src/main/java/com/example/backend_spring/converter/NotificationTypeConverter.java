package com.example.backend_spring.converter;

import com.example.backend_spring.enums.NotificationType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class NotificationTypeConverter implements AttributeConverter<NotificationType, String> {

    @Override
    public String convertToDatabaseColumn(NotificationType attribute) {
        if (attribute == null) return null;
        return attribute.name().toLowerCase();
    }

    @Override
    public NotificationType convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return NotificationType.valueOf(dbData.toUpperCase());
    }
}
