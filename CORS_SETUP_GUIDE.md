# CORS 에러 해결 가이드

CORS (Cross-Origin Resource Sharing) 에러를 해결하는 방법은 두 가지가 있습니다.

## 방법 1: Next.js API Route 프록시 사용 (권장 - 빠른 해결)

프론트엔드 코드는 이미 프록시를 사용하도록 설정되어 있습니다.

### 설정 방법

1. **환경 변수 설정** (`.env.local` 파일)

```env
# 백엔드 API URL (프록시가 사용)
BACKEND_API_BASE_URL=http://localhost:8080

# 또는 프록시 사용 명시
NEXT_PUBLIC_USE_API_PROXY=true
```

2. **프록시 동작 방식**
   - 클라이언트 → Next.js API Route (`/api/hospitals/nearby`)
   - Next.js API Route → 백엔드 서버 (`http://localhost:8080/hospitals/nearby`)
   - 서버 사이드에서 요청하므로 CORS 문제가 없음

3. **장점**
   - 백엔드 코드 수정 불필요
   - 즉시 사용 가능
   - 프로덕션에서도 사용 가능

---

## 방법 2: 백엔드에서 CORS 설정 (Spring Boot 기준)

백엔드를 직접 수정할 수 있다면, 백엔드에서 CORS를 허용하도록 설정하는 것이 더 올바른 방법입니다.

### Spring Boot 설정 방법

#### 옵션 A: `@CrossOrigin` 어노테이션 사용 (간단)

```java
@RestController
@RequiredArgsConstructor
@RequestMapping("/hospitals")
@CrossOrigin(origins = "*") // 모든 origin 허용 (개발 환경)
// 또는
@CrossOrigin(origins = "http://localhost:3000") // 특정 origin만 허용 (프로덕션 권장)
public class HospitalController {
    // ... 기존 코드
}
```

#### 옵션 B: WebMvcConfigurer 사용 (전역 설정 - 권장)

`config` 패키지에 설정 클래스 생성:

```java
package com.normaldeve.carelinkbackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000") // 프론트엔드 URL
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

#### 옵션 C: Security Filter 사용 (Spring Security 사용 시)

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()));
        // ... 기타 설정
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

### 프론트엔드 설정 변경

백엔드에서 CORS를 설정했다면, 프론트엔드에서 직접 백엔드 API를 호출하도록 설정:

**.env.local**:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
# 프록시 사용 안 함
NEXT_PUBLIC_USE_API_PROXY=false
```

---

## 권장 사항

### 개발 환경
- **Next.js 프록시 사용** (방법 1) - 빠르고 간단

### 프로덕션 환경
- **백엔드 CORS 설정** (방법 2) - 더 안전하고 올바른 방법
- 특정 도메인만 허용하도록 설정 (`origins = "https://yourdomain.com"`)

---

## 문제 해결

### 여전히 CORS 에러가 발생하는 경우

1. **백엔드 서버가 실행 중인지 확인**
   ```bash
   curl http://localhost:8080/hospitals/nearby?lat=37.5665&lng=126.9780&km=5
   ```

2. **환경 변수가 올바르게 설정되었는지 확인**
   - `.env.local` 파일이 프로젝트 루트에 있는지
   - 변수명이 정확한지 (`NEXT_PUBLIC_` 접두사 확인)
   - 개발 서버 재시작 (`npm run dev`)

3. **브라우저 콘솔 확인**
   - 네트워크 탭에서 실제 요청 URL 확인
   - 에러 메시지 확인

4. **프록시 사용 시**
   - `/api/hospitals/nearby` 엔드포인트가 동작하는지 확인
   - Next.js 서버 로그 확인

