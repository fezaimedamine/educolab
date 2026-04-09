package com.example.backend_spring.repository;

import com.example.backend_spring.entity.User;
import com.example.backend_spring.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // Students can see: all teachers + students in the same group
    @Query("SELECT u FROM User u WHERE u.isActive = true AND " +
           "(u.role = :teacherRole OR (u.role = :studentRole AND u.groupName = :groupName))")
    List<User> findVisibleForStudent(
            @Param("teacherRole") UserRole teacherRole,
            @Param("studentRole") UserRole studentRole,
            @Param("groupName") String groupName);

    // Teachers see everyone except admins
    List<User> findByRoleNotAndIsActiveTrue(UserRole role);

    // Admin sees all active users
    List<User> findByIsActiveTrue();
}
