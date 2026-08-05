import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAuthRbacProduction1770391229840 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // USERS
    await queryRunner.query(`
      CREATE TABLE users (
          id BIGSERIAL PRIMARY KEY,

          email VARCHAR(150) NOT NULL UNIQUE,
          user_name VARCHAR(30) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,

          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          is_verified BOOLEAN NOT NULL DEFAULT FALSE,

          status VARCHAR(20) NOT NULL DEFAULT 'offline',

          failed_login_attempts INT NOT NULL DEFAULT 0,
          locked_until TIMESTAMP NULL,
          last_login_at TIMESTAMP NULL,

          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
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
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL UNIQUE,
          full_name VARCHAR(100) NOT NULL,
          avatar VARCHAR(255),
          avatar_public_id VARCHAR(255),
          cover_image VARCHAR(255),
          cover_image_public_id VARCHAR(255),
          bio TEXT,
          gender VARCHAR(20),
          birthday DATE,
          phone VARCHAR(20),
          height DECIMAL(5,2),
          weight DECIMAL(5,2),
          body_fat DECIMAL(5,2),
          goal VARCHAR(50),
          fitness_level VARCHAR(30) DEFAULT 'beginner',
          experience_years SMALLINT DEFAULT 0,
          city VARCHAR(100),
          country VARCHAR(100),
          privacy_setting VARCHAR(20) DEFAULT 'public',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT fk_profiles_user
              FOREIGN KEY (user_id)
              REFERENCES users(id)
              ON DELETE CASCADE
      );
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
    // await queryRunner.query(`
    //   CREATE TABLE reset_password_tokens (
    //     id SERIAL PRIMARY KEY,
    //     token TEXT NOT NULL UNIQUE,

    //     user_id BIGINT NOT NULL,

    //     expired_at TIMESTAMP NOT NULL,
    //     is_used BOOLEAN DEFAULT FALSE,

    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    //     CONSTRAINT fk_rpt_user
    //       FOREIGN KEY (user_id)
    //       REFERENCES users(id)
    //       ON DELETE CASCADE
    //   )
    // `);

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

    // ======================
    // ROLES
    // ======================
    await queryRunner.query(`
      INSERT INTO roles (name, code, description)
      VALUES
        ('Super Admin', 'SUPER_ADMIN', 'Full system access'),
        ('Administrator', 'ADMIN', 'System administrator'),
        ('User', 'USER', 'Normal user');
    `);

    // ======================
    // PERMISSIONS
    // ======================
    await queryRunner.query(`
      INSERT INTO permissions (name, code, module)
      VALUES
        ('Create User', 'CREATE_USER', 'USER'),
        ('Update User', 'UPDATE_USER', 'USER'),
        ('Delete User', 'DELETE_USER', 'USER'),
        ('View User', 'VIEW_USER', 'USER'),

        ('Create Category', 'CREATE_CATEGORY', 'CATEGORY'),
        ('Update Category', 'UPDATE_CATEGORY', 'CATEGORY'),
        ('Delete Category', 'DELETE_CATEGORY', 'CATEGORY'),
        ('View Category', 'VIEW_CATEGORY', 'CATEGORY'),

        ('Create Product', 'CREATE_PRODUCT', 'PRODUCT'),
        ('Update Product', 'UPDATE_PRODUCT', 'PRODUCT'),
        ('Delete Product', 'DELETE_PRODUCT', 'PRODUCT'),
        ('View Product', 'VIEW_PRODUCT', 'PRODUCT'),

        ('View Dashboard', 'VIEW_DASHBOARD', 'DASHBOARD');
    `);

    // ======================
    // SUPER ADMIN -> ALL PERMISSIONS
    // ======================
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.code = 'SUPER_ADMIN';
    `);

    // ======================
    // ADMIN
    // ======================
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      JOIN permissions p
        ON p.code IN (
          'VIEW_DASHBOARD',
          'VIEW_USER',
          'CREATE_USER',
          'UPDATE_USER',
          'VIEW_CATEGORY',
          'CREATE_CATEGORY',
          'UPDATE_CATEGORY',
          'VIEW_PRODUCT',
          'CREATE_PRODUCT',
          'UPDATE_PRODUCT'
        )
      WHERE r.code = 'ADMIN';
    `);

    // ======================
    // USER
    // ======================
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      JOIN permissions p
        ON p.code IN (
          'VIEW_DASHBOARD',
          'VIEW_PRODUCT',
          'VIEW_CATEGORY'
        )
      WHERE r.code = 'USER';
    `);

    // ======================
    // USERS
    // password: 123456
    // ======================
    await queryRunner.query(`
      INSERT INTO users
        (email, user_name, password, is_verified)
      VALUES
        (
          'admin@gmail.com',
          'admin',
          '$2b$10$rvYkmCsdWQpSVkW0BPp9RuHdHsnTpXuxOHjW5GGYyoy7aJ9.H/xsy',
          true
        ),
        (
          'manager@gmail.com',
          'manager',
          '$2b$10$rvYkmCsdWQpSVkW0BPp9RuHdHsnTpXuxOHjW5GGYyoy7aJ9.H/xsy',
          true
        ),
        (
          'user@gmail.com',
          'user',
          '$2b$10$rvYkmCsdWQpSVkW0BPp9RuHdHsnTpXuxOHjW5GGYyoy7aJ9.H/xsy',
          true
        );
    `);

    // ======================
    // PROFILES
    // ======================
    await queryRunner.query(`
      INSERT INTO profiles
        (
          user_id,
          full_name,
          gender,
          birthday,
          phone,
          height,
          weight,
          goal,
          fitness_level
        )
      SELECT
          id,
          'System Admin',
          'Male',
          '1995-01-01',
          '0900000001',
          175,
          72,
          'Maintain',
          'advanced'
      FROM users
      WHERE user_name='admin';
    `);

    await queryRunner.query(`
      INSERT INTO profiles
        (
          user_id,
          full_name,
          gender,
          birthday,
          phone,
          height,
          weight,
          goal,
          fitness_level
        )
      SELECT
          id,
          'Gym Manager',
          'Male',
          '1998-05-20',
          '0900000002',
          178,
          78,
          'Muscle Gain',
          'intermediate'
      FROM users
      WHERE user_name='manager';
    `);

    await queryRunner.query(`
      INSERT INTO profiles
        (
          user_id,
          full_name,
          gender,
          birthday,
          phone,
          height,
          weight,
          goal,
          fitness_level
        )
      SELECT
          id,
          'Normal User',
          'Female',
          '2000-10-15',
          '0900000003',
          160,
          52,
          'Weight Loss',
          'beginner'
      FROM users
      WHERE user_name='user';
    `);

    // ======================
    // USER ROLES
    // ======================
    await queryRunner.query(`
      INSERT INTO user_roles(user_id, role_id)
      SELECT u.id,r.id
      FROM users u
      JOIN roles r ON r.code='SUPER_ADMIN'
      WHERE u.user_name='admin';
    `);

    await queryRunner.query(`
      INSERT INTO user_roles(user_id, role_id)
      SELECT u.id,r.id
      FROM users u
      JOIN roles r ON r.code='ADMIN'
      WHERE u.user_name='manager';
    `);

    await queryRunner.query(`
      INSERT INTO user_roles(user_id, role_id)
      SELECT u.id,r.id
      FROM users u
      JOIN roles r ON r.code='USER'
      WHERE u.user_name='user';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ==========================
    // INVENTORY
    // ==========================
    await queryRunner.query(`DROP TABLE IF EXISTS inventory_logs CASCADE`);

    // ==========================
    // PRODUCT
    // ==========================
    await queryRunner.query(`DROP TABLE IF EXISTS product_tags CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS product_images CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS product_variants CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS products CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS tags CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sizes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS colors CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS categories CASCADE`);

    // ==========================
    // AUTH
    // ==========================
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs CASCADE`);

    // await queryRunner.query(
    //   `DROP TABLE IF EXISTS reset_password_tokens CASCADE`,
    // );
    await queryRunner.query(`DROP TABLE IF EXISTS verify_tokens CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS role_permissions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_roles CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS profiles CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS permissions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
  }
}
