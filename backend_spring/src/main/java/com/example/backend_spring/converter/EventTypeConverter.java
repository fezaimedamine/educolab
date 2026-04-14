package com.example.backend_spring.converter;

import com.example.backend_spring.enums.EventType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class EventTypeConverter implements AttributeConverter<EventType, String> {

    @Override
    public String convertToDatabaseColumn(EventType eventType) {
        if (eventType == null) {
            return null;
        }
        return eventType.name().toLowerCase();
    }

    @Override
    public EventType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return null;
        }
        return EventType.valueOf(dbData.toUpperCase());
    }
}