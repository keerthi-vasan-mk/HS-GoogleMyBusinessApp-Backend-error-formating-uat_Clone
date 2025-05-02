import {
  Entity, BaseEntity, PrimaryColumn,
  PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, BeforeInsert
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Entity('admin')
export class AdminUser extends BaseEntity {
  /**
   * Internal identifier
   */
  @PrimaryGeneratedColumn()
  public id: number;

  /**
   * The admin's username.
   */
  @PrimaryColumn()
  public username: string;

  /**
   * The admin's password (hashed).
   */
  @Column()
  private password: string;

  /**
   * Whether the admin has access to
   * see data other than analytics.
   */
  @Column({ default: true })
  public analytics_only: boolean;

  @CreateDateColumn()
  public created_at: Date;

  @UpdateDateColumn()
  public updated_at: Date;

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    this.password = await bcrypt.hash(this.password, 10);
  }

  async comparePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }

}