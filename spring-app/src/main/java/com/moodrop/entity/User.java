package com.moodrop.entity;
import com.moodrop.Enums.RoleType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User{

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 40)
    private String userId;

    @Column(nullable = false, length = 40)
    private String name;

    @Column(nullable = false, length = 100)
    private String email; 

    @Column(nullable = false, length = 80)
    private String password;

    // enum으로 넘어온 값을 String으로 저장한다. 
    @Enumerated(EnumType.STRING)
    private RoleType role;

    // 필요할 때만 이미지를 가져올 수 있게 LAZY Loading으로 구현한다.
    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name="image_id")
    private Image image;

    @Column(length = 400)
    private String intro;

    // 로그인 시마다 증가, 토큰과 버전이 다르면 만료된 토큰으로 처리
    @Column(nullable = false, columnDefinition = "int default 0")
    private int tokenVersion = 0;

}