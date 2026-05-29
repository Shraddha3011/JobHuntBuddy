package com.jobhuntbuddy.backend.controller;
import com.jobhuntbuddy.backend.dto.AuthRequest;
import com.jobhuntbuddy.backend.entity.User;
import com.jobhuntbuddy.backend.repository.UserRepository;
import com.jobhuntbuddy.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest req) {
        if (userRepo.existsByEmail(req.getEmail()))
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        User user = User.builder()
                .email(req.getEmail())
                .password(encoder.encode(req.getPassword()))
                .name(req.getName())
                .build();
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("token", jwtUtil.generateToken(user.getEmail()), "name", user.getName()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest req) {
        return userRepo.findByEmail(req.getEmail())
                .filter(u -> encoder.matches(req.getPassword(), u.getPassword()))
                .map(u -> ResponseEntity.ok(Map.of("token", jwtUtil.generateToken(u.getEmail()), "name", u.getName())))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials")));
    }
}