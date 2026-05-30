package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepo;

    public UserController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    // GET /api/users/me — dane zalogowanego użytkownika
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        return userRepo.findByUsername(auth.getName())
                .map(u -> ResponseEntity.ok(Map.of(
                        "id",       u.getId(),
                        "username", u.getUsername(),
                        "email",    u.getEmail(),
                        "role",     u.getRole().name()
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/users — lista użytkowników (tylko ADMIN)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getAll() {
        return userRepo.findAll();
    }

    // DELETE /api/users/{id} — usuń użytkownika (tylko ADMIN)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!userRepo.existsById(id)) return ResponseEntity.notFound().build();
        userRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Użytkownik usunięty"));
    }
}