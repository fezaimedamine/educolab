package com.example.backend_spring.dto.messaging;

import com.example.backend_spring.entity.Conversation;
import com.example.backend_spring.enums.UserRole;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class ConversationResponse {
    private UUID id;
    private String type;
    private String name;
    private OffsetDateTime createdAt;
    private List<MemberInfo> members;

    private String inviteCode; // Only for group conversations

    @Data
    public static class MemberInfo {
        private UUID userId;
        private String firstName;
        private String lastName;
        private String email;
        private UserRole role;
    }

    public static ConversationResponse from(Conversation c) {
        ConversationResponse r = new ConversationResponse();
        r.id = c.getId();
        r.type = c.getType().name().toLowerCase();
        r.name = c.getName();
        r.inviteCode = c.getInviteCode();
        r.createdAt = c.getCreatedAt();
        r.members = c.getMembers().stream().map(m -> {
            MemberInfo mi = new MemberInfo();
            mi.userId = m.getUser().getId();
            mi.firstName = m.getUser().getFirstName();
            mi.lastName = m.getUser().getLastName();
            mi.email = m.getUser().getEmail();
            mi.role = m.getUser().getRole();
            return mi;
        }).toList();
        return r;
    }
}
