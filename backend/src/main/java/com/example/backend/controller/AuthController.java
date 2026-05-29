package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtils;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthController(UserRepository userRepo,
                          PasswordEncoder passwordEncoder,
                          JwtUtils jwtUtils) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    // ── DTOs ────────────────────────────────────────────────────────────────

    public record RegisterRequest(
            @NotBlank @Size(min = 3, max = 64) String username,
            @NotBlank @Size(min = 6)           String password,
            @NotBlank @Email                   String email
    ) {}

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {}

    // ── Endpoints ───────────────────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepo.existsByUsername(req.username())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Nazwa użytkownika jest już zajęta"));
        }
        if (userRepo.existsByEmail(req.email())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email jest już używany"));
        }

        User user = new User();
        user.setUsername(req.username());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setEmail(req.email());
        user.setRole(User.Role.USER);

        userRepo.save(user);
        return ResponseEntity.ok(Map.of("message", "Rejestracja zakończona pomyślnie"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        return userRepo.findByUsername(req.username())
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .map(u -> {
                    String token = jwtUtils.generateToken(
                            u.getUsername(), u.getRole().name()
                    );
                    return ResponseEntity.ok(Map.of(
                            "token", token,
                            "username", u.getUsername(),
                            "role", u.getRole().name()
                    ));
                })
                .orElse(ResponseEntity.status(401)
                        .body(Map.of("error", "Nieprawidłowe dane logowania")));
    }
}
