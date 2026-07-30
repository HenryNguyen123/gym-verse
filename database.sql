-- =========================
-- AUTH + RBAC PRODUCTION SCHEMA
-- =========================

-- USERS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,

  email VARCHAR(255) NOT NULL UNIQUE,
  user_name VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,

  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,

  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  last_login_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAM
);

-- PROFILES
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,

    full_name VARCHAR(255),
    gender VARCHAR(50),
    dob DATE,
    phone VARCHAR(50),
    avatar VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_profiles_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE
);

-- ROLES
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PERMISSIONS
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER_ROLES
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,

    PRIMARY KEY (user_id, role_id),

    CONSTRAINT fk_ur_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_ur_role FOREIGN KEY (role_id)
        REFERENCES roles(id) ON DELETE CASCADE
);

-- ROLE_PERMISSIONS
CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,

    PRIMARY KEY (role_id, permission_id),

    CONSTRAINT fk_rp_role FOREIGN KEY (role_id)
        REFERENCES roles(id) ON DELETE CASCADE,

    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id)
        REFERENCES permissions(id) ON DELETE CASCADE
);

-- REFRESH TOKENS
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rt_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

-- VERIFY TOKEN
CREATE TABLE verify_tokens (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_vt_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

-- RESET PASSWORD TOKEN
CREATE TABLE reset_password_tokens (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rpt_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(100),
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE SET NULL
);

-- =========================
-- INDEX TỐI ƯU HIỆU NĂNG
-- =========================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(user_name);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);

-- =========================
-- SEED DATA CƠ BẢN
-- =========================

INSERT INTO roles (name, code, description) VALUES
('Super Admin', 'SUPER_ADMIN', 'Full system access'),
('Administrator', 'ADMIN', 'System administrator'),
('User', 'USER', 'Normal user');

INSERT INTO permissions (name, code, module) VALUES
('Create User', 'CREATE_USER', 'USER'),
('Update User', 'UPDATE_USER', 'USER'),
('Delete User', 'DELETE_USER', 'USER'),
('View Dashboard', 'VIEW_DASHBOARD', 'DASHBOARD');

-- SUPER_ADMIN full quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'SUPER_ADMIN';

-- USER chỉ xem dashboard
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'VIEW_DASHBOARD'
WHERE r.code = 'USER';

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
SELECT tablename FROM pg_tables WHERE schemaname='public';
select * from audit_logs