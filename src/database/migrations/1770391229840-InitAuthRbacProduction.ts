import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAuthRbacProduction1770391229840 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // USERS
    await queryRunner.query(`
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ROLES
    await queryRunner.query(`
      CREATE TABLE roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // PERMISSIONS
    await queryRunner.query(`
      CREATE TABLE permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(100) NOT NULL UNIQUE,
        description VARCHAR(255),
        module VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // PROFILES
    await queryRunner.query(`
      CREATE TABLE profiles (
        id SERIAL PRIMARY KEY,
        user_id BIGINT UNIQUE NOT NULL,

        full_name VARCHAR(255),
        gender VARCHAR(50),
        dob DATE,
        phone VARCHAR(50),
        avatar VARCHAR(255),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_profiles_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE CASCADE
      )
    `);

    // USER_ROLES
    await queryRunner.query(`
      CREATE TABLE user_roles (
        user_id BIGINT NOT NULL,
        role_id BIGINT NOT NULL,

        PRIMARY KEY (user_id, role_id),

        CONSTRAINT fk_ur_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,

        CONSTRAINT fk_ur_role FOREIGN KEY (role_id)
          REFERENCES roles(id) ON DELETE CASCADE
      )
    `);

    // ROLE_PERMISSIONS
    await queryRunner.query(`
      CREATE TABLE role_permissions (
        role_id BIGINT NOT NULL,
        permission_id BIGINT NOT NULL,

        PRIMARY KEY (role_id, permission_id),

        CONSTRAINT fk_rp_role FOREIGN KEY (role_id)
          REFERENCES roles(id) ON DELETE CASCADE,

        CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id)
          REFERENCES permissions(id) ON DELETE CASCADE
      )
    `);

    // REFRESH TOKENS
    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_rt_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // VERIFY TOKENS
    await queryRunner.query(`
      CREATE TABLE verify_tokens (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,

        user_id BIGINT NOT NULL,

        expired_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_verify_user
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      )
    `);

    // RESET PASSWORD TOKEN
    await queryRunner.query(`
      CREATE TABLE reset_password_tokens (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,

        user_id BIGINT NOT NULL,

        expired_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_rpt_user
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE
      )
    `);

    // AUDIT LOGS
    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id SERIAL PRIMARY KEY,
        user_id BIGINT,
        action VARCHAR(100),
        ip_address VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    ///////////////////////////////////////////
    /// categories and products
    //////////////////////////
    //CATEGORY
    await queryRunner.query(`
      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,  
        description TEXT,
        image VARCHAR(255),
        parent_id BIGINT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_by BIGINT,
        updated_by BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_category_parent
          FOREIGN KEY (parent_id)
          REFERENCES categories(id)
          ON DELETE SET NULL,
        CONSTRAINT fk_category_created_by
          FOREIGN KEY (created_by)
          REFERENCES users(id)
          ON DELETE SET NULL,
        CONSTRAINT fk_category_updated_by
          FOREIGN KEY (updated_by)
          REFERENCES users(id)
          ON DELETE SET NULL
      );
    `);

    //COLORS
    await queryRunner.query(`
      CREATE TABLE colors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        hex_code VARCHAR(20),

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );  
    `);

    //sizes
    await queryRunner.query(`
      CREATE TABLE sizes (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          code VARCHAR(50) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    //PRODUCTS
    await queryRunner.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        category_id BIGINT,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        sku VARCHAR(100) UNIQUE,
        short_description TEXT,
        description TEXT,
        thumbnail VARCHAR(255),
        price DECIMAL(12,2) NOT NULL,
        sale_price DECIMAL(12,2),
        stock INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        created_by BIGINT,
        updated_by BIGINT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_product_category
          FOREIGN KEY (category_id)
          REFERENCES categories(id)
          ON DELETE SET NULL,
        CONSTRAINT fk_product_created_by
          FOREIGN KEY (created_by)
          REFERENCES users(id)
          ON DELETE SET NULL,
        CONSTRAINT fk_product_updated_by
          FOREIGN KEY (updated_by)
          REFERENCES users(id)
          ON DELETE SET NULL
      );  
    `);

    //PRODUCT IMAGES
    await queryRunner.query(`
      CREATE TABLE product_images (
        id SERIAL PRIMARY KEY,
        product_id BIGINT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        is_thumbnail BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_pi_product
          FOREIGN KEY (product_id)
          REFERENCES products(id)
          ON DELETE CASCADE
      );  
    `);

    //PRODUCT VARIANTS
    await queryRunner.query(`
      CREATE TABLE product_variants (
        id SERIAL PRIMARY KEY,
        product_id BIGINT NOT NULL,
        color_id BIGINT,
        size_id BIGINT,
        sku VARCHAR(100) UNIQUE,
        price DECIMAL(12,2),
        sale_price DECIMAL(12,2),
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_variant_product
          FOREIGN KEY (product_id)
          REFERENCES products(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_variant_color
          FOREIGN KEY (color_id)
          REFERENCES colors(id)
          ON DELETE SET NULL,
        CONSTRAINT fk_variant_size
          FOREIGN KEY (size_id)
          REFERENCES sizes(id)
          ON DELETE SET NULL
      );
    `);

    //TAGS
    await queryRunner.query(`
      CREATE TABLE tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL
      );
    `);

    //PRODUCT TAGS
    await queryRunner.query(`
      CREATE TABLE product_tags (
        product_id BIGINT NOT NULL,
        tag_id BIGINT NOT NULL,
        PRIMARY KEY(product_id, tag_id),

        CONSTRAINT fk_pt_product
          FOREIGN KEY(product_id)
          REFERENCES products(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_pt_tag
          FOREIGN KEY(tag_id)
          REFERENCES tags(id)
          ON DELETE CASCADE
      );
    `);

    // /INVENTORY LOGS
    await queryRunner.query(`
      CREATE TABLE inventory_logs (
        id SERIAL PRIMARY KEY,
        product_variant_id BIGINT NOT NULL,
        type VARCHAR(50) NOT NULL,
        quantity INT NOT NULL,
        note TEXT,
        created_by BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_il_variant
          FOREIGN KEY(product_variant_id)
          REFERENCES product_variants(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_il_created_by
          FOREIGN KEY(created_by)
          REFERENCES users(id)
          ON DELETE SET NULL
      );
    `);

    /////////////////////

    // INDEXES
    await queryRunner.query(`CREATE INDEX idx_users_email ON users(email)`);
    await queryRunner.query(
      `CREATE INDEX idx_users_username ON users(user_name)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_user_roles_user ON user_roles(user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_role_permissions_role ON role_permissions(role_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_refresh_user ON refresh_tokens(user_id)`,
    );
    await queryRunner.query(`
      CREATE INDEX idx_verify_tokens_user ON verify_tokens(user_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_verify_tokens_token ON verify_tokens(token)
    `);

    // ===== SEED DATA =====

    await queryRunner.query(`
      INSERT INTO roles (name, code, description) VALUES
      ('Super Admin', 'SUPER_ADMIN', 'Full system access'),
      ('Administrator', 'ADMIN', 'System administrator'),
      ('User', 'USER', 'Normal user')
    `);

    await queryRunner.query(`
      INSERT INTO permissions (name, code, module) VALUES
      ('Create User', 'CREATE_USER', 'USER'),
      ('Update User', 'UPDATE_USER', 'USER'),
      ('Delete User', 'DELETE_USER', 'USER'),
      ('View Dashboard', 'VIEW_DASHBOARD', 'DASHBOARD')
    `);

    // SUPER_ADMIN full quyền
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r, permissions p
      WHERE r.code = 'SUPER_ADMIN'
    `);

    // USER chỉ xem dashboard
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      JOIN permissions p ON p.code = 'VIEW_DASHBOARD'
      WHERE r.code = 'USER'
    `);

    // seed fake user
    await queryRunner.query(`
      INSERT INTO users (email, user_name, password)
      VALUES
      (
        'admin@gmail.com',
        'admin',
        '$2b$10$rvYkmCsdWQpSVkW0BPp9RuHdHsnTpXuxOHjW5GGYyoy7aJ9.H/xsy'
      ),
      (
        'user@gmail.com',
        'user',
        '$2b$10$rvYkmCsdWQpSVkW0BPp9RuHdHsnTpXuxOHjW5GGYyoy7aJ9.H/xsy'
      )
    `);
    await queryRunner.query(`
      INSERT INTO profiles (user_id, full_name, gender, dob, phone)
      SELECT id, 'System Admin', 'Male', '1995-01-01', '0900000001'
      FROM users WHERE user_name = 'admin'
    `);

    await queryRunner.query(`
      INSERT INTO profiles (user_id, full_name, gender, dob, phone)
      SELECT id, 'Normal User', 'Male', '2000-01-01', '0900000002'
      FROM users WHERE user_name = 'user'
    `);
    // Admin → SUPER_ADMIN
    await queryRunner.query(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT u.id, r.id
      FROM users u
      JOIN roles r ON r.code = 'SUPER_ADMIN'
      WHERE u.user_name = 'admin'
    `);
    // User → USER
    await queryRunner.query(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT u.id, r.id
      FROM users u
      JOIN roles r ON r.code = 'USER'
      WHERE u.user_name = 'user'
    `);
    //fake permission
    await queryRunner.query(`
      INSERT INTO permissions (name, code, module)
      VALUES
      ('Create Category', 'CREATE_CATEGORY', 'CATEGORY'),
      ('Update Category', 'UPDATE_CATEGORY', 'CATEGORY'),
      ('Delete Category', 'DELETE_CATEGORY', 'CATEGORY'),
      ('View Category Detail', 'VIEW_CATEGORY', 'CATEGORY'),
      ('List Categories', 'LIST_CATEGORY', 'CATEGORY'),
      ('test Categories', 'TEST_CATEGORY', 'CATEGORY')
    `);
    //SUPER_ADMIN full quyền
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      JOIN permissions p ON p.code = 'TEST_CATEGORY'
      WHERE r.code = 'SUPER_ADMIN'
    `);
    //USER chỉ có quyền test
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      JOIN permissions p ON p.code = 'TEST_CATEGORY'
      WHERE r.code = 'USER'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS verify_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS profiles`);
    await queryRunner.query(`DROP TABLE IF EXISTS permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
