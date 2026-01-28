# Forge Framework - Operations & Extension

**Version:** 1.0.0
**Status:** Active
**Last Updated:** 2026-01-28

---

## Shell + Core Architecture

Forge follows a "Shell + Core" definition:

- **Shell (Generated)**: Transports, DTOs, Wiring, Interfaces, Infrastructure
- **Core (Manual)**: Business Logic, Complex Validation, Specialized Algorithms

---

## Custom Code Hooks & Preservation

### File Preservation Rules

1. **`_custom.go` suffix**: Files ending in `_custom.go` are NEVER touched by the generator
2. **Interface Binding**: Generated code defines interfaces that manual code implements
3. **Middleware Hooks**: Transport files generate extension points

### Interface Binding Example

Generated code (`user.go`):

```go
// UserRepository defines the data access interface
type UserRepository interface {
    Create(ctx context.Context, user *User) error
    Get(ctx context.Context, id uuid.UUID) (*User, error)
    List(ctx context.Context, opts ListOptions) ([]*User, error)
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id uuid.UUID) error
}
```

Manual implementation (`user_custom.go`):

```go
// userRepositoryImpl implements UserRepository with custom behavior
type userRepositoryImpl struct {
    db *gorm.DB
    cache *redis.Client
}

func (r *userRepositoryImpl) Get(ctx context.Context, id uuid.UUID) (*User, error) {
    // Custom caching logic
    if cached, ok := r.checkCache(ctx, id); ok {
        return cached, nil
    }
    // ... database query with custom joins
}
```

### Middleware Hooks

Generated transport (`user_transport.go`):

```go
// RegisterMiddleware allows adding custom middleware to user endpoints
func (t *UserTransport) RegisterMiddleware(mw func(http.Handler) http.Handler) {
    t.middleware = append(t.middleware, mw)
}
```

Manual middleware registration (`module.go` extension):

```go
func init() {
    // Add rate limiting to user endpoints
    userTransport.RegisterMiddleware(ratelimit.New(100))
}
```

---

## Database Evolution

Forge generates **Schema Definitions** but provides limited migration logic for complex changes.

### Iterative Generation

1. **Initial generation**: `forge generate` produces `YYYYMMDD_init.up.sql` if no schema exists
2. **Additive changes**: If schema exists, generates additive diff (e.g., `ALTER TABLE ADD COLUMN`)
3. **Manual control**: Complex changes require manual migration files

### What Gets Auto-Generated

| Change Type           | Auto-Generated | Manual Required |
| --------------------- | -------------- | --------------- |
| Add new table         | ✅             |                 |
| Add column (nullable) | ✅             |                 |
| Add column (non-null) |                | ✅              |
| Rename column         |                | ✅              |
| Change column type    |                | ✅              |
| Add index             | ✅             |                 |
| Drop column           |                | ✅              |
| Data migration        |                | ✅              |

### Manual Migration Location

Complex migrations go in `cmd/migrator/migrations/`:

```
cmd/migrator/migrations/
├── 20260101_init.up.sql        # Generated
├── 20260115_add_email.up.sql   # Generated
├── 20260120_rename_name.up.sql # MANUAL - rename first_name to name
└── 20260125_migrate_data.up.sql # MANUAL - data transformation
```

The generator acknowledges manually created files and won't overwrite them.

---

## Extension Points

### 1. Custom Validators

Register custom validation functions:

```go
// In user_custom.go
func init() {
    forge.RegisterValidator("user", "email", validateCorporateEmail)
}

func validateCorporateEmail(email string) error {
    if !strings.HasSuffix(email, "@company.com") {
        return errors.New("must use corporate email")
    }
    return nil
}
```

### 2. Custom Serializers

Override JSON:API serialization:

```go
// In user_custom.go
func (u *User) MarshalJSONAPI() ([]byte, error) {
    // Custom serialization logic
}
```

### 3. Lifecycle Hooks

```go
// In user_custom.go
func (u *User) BeforeCreate(ctx context.Context) error {
    u.ID = uuid.New()
    u.CreatedAt = time.Now()
    return nil
}

func (u *User) AfterCreate(ctx context.Context) error {
    // Send welcome email
    return notifications.SendWelcome(ctx, u.Email)
}
```

### 4. Custom gRPC Interceptors

```go
// In module.go extension
func provideGRPCServer(interceptors ...grpc.UnaryServerInterceptor) *grpc.Server {
    return grpc.NewServer(
        grpc.ChainUnaryInterceptor(
            append(defaultInterceptors, interceptors...)...,
        ),
    )
}
```

---

## Forge Directives

Special comments that control code generation:

| Directive           | Description                              |
| ------------------- | ---------------------------------------- |
| `//forge:ignore`    | Exclude function from AST discovery      |
| `//forge:override`  | Mark as override for generated interface |
| `//forge:hook`      | Register as lifecycle hook               |
| `//forge:validator` | Register as custom validator             |

Example:

```go
//forge:ignore - internal helper, not for node palette
func internalHelper() {}

//forge:override UserRepository.Get
func (r *userRepo) Get(ctx context.Context, id uuid.UUID) (*User, error) {
    // Custom implementation
}
```

---

**Related Specifications:**

- [Code Generation](04-code-generation.md)
- [Features](02-features.md)
- [Architecture](01-architecture.md)
