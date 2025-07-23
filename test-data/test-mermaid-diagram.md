graph TD
    A[User Request] --> B{Authentication Required?}
    B -->|Yes| C[Login/Register]
    B -->|No| D[Process Request]
    C --> E[Validate Credentials]
    E -->|Valid| F[Generate JWT Token]
    E -->|Invalid| G[Return Error]
    F --> D
    G --> H[Display Error Message]
    D --> I[Parse Request Data]
    I --> J{Data Valid?}
    J -->|Yes| K[Business Logic Processing]
    J -->|No| L[Validation Error]
    K --> M[Database Operations]
    M --> N{Transaction Success?}
    N -->|Yes| O[Prepare Response]
    N -->|No| P[Rollback & Error]
    O --> Q[Send Response]
    P --> R[Log Error]
    L --> S[Return Validation Error]
    H --> T[End]
    Q --> T
    R --> T
    S --> T

    %% Styling
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    class A,T startEnd
    class C,D,E,F,I,K,M,O,Q process
    class B,J,N decision
    class G,H,L,P,R,S error