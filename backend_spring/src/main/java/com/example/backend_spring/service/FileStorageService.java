package com.example.backend_spring.service;

import com.example.backend_spring.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
@Slf4j
public class FileStorageService {

    @Value("${file.upload.dir:src/main/resources/static/uploads}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final int MAX_FILES_PER_MESSAGE = 5;

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            // Images
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp",
            // PDF
            "application/pdf",
            // MS Office
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    @PostConstruct
    public void init() {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("Created upload directory: {}", uploadPath.toAbsolutePath());
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public void validateFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("No files provided");
        }

        if (files.size() > MAX_FILES_PER_MESSAGE) {
            throw new BadRequestException("Maximum " + MAX_FILES_PER_MESSAGE + " files allowed per message");
        }

        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                throw new BadRequestException("File cannot be empty");
            }

            if (file.getSize() > MAX_FILE_SIZE) {
                throw new BadRequestException("File size exceeds 10MB limit: " + file.getOriginalFilename());
            }

            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
                throw new BadRequestException("File type not allowed: " + contentType);
            }
        }
    }

    public String storeFile(MultipartFile file, UUID conversationId) {
        try {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isEmpty()) {
                throw new BadRequestException("Invalid filename");
            }

            // Sanitize filename
            String sanitizedFilename = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");

            // Create unique filename: UUID_originalName
            String uniqueFilename = UUID.randomUUID() + "_" + sanitizedFilename;

            // Create conversation-specific directory
            Path conversationDir = Paths.get(uploadDir, conversationId.toString());
            if (!Files.exists(conversationDir)) {
                Files.createDirectories(conversationDir);
            }

            // Store file
            Path targetLocation = conversationDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Return relative path
            return conversationId.toString() + "/" + uniqueFilename;

        } catch (IOException e) {
            log.error("Failed to store file", e);
            throw new RuntimeException("Failed to store file", e);
        }
    }

    public Resource loadFileAsResource(String filePath) {
        try {
            Path file = Paths.get(uploadDir).resolve(filePath).normalize();
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found: " + filePath);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("File not found: " + filePath, e);
        }
    }

    public void deleteFile(String filePath) {
        try {
            Path file = Paths.get(uploadDir).resolve(filePath).normalize();
            Files.deleteIfExists(file);
            log.info("Deleted file: {}", filePath);
        } catch (IOException e) {
            log.error("Failed to delete file: {}", filePath, e);
        }
    }
}