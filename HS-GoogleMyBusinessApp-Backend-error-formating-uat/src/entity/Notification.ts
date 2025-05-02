import { Entity, BaseEntity, PrimaryColumn, Check, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { NotificationTypes, NotificationStreamTypes } from '../types/notifications';

/**
 * Using the `Check` decorator in conjunction with the
 * primary column `single_row_id` ensures this will be
 * the sole row in the table.
 */
@Entity('notification')
@Check('single_row_id = TRUE')
export class Notification extends BaseEntity {
  @PrimaryColumn('boolean', {
    default: true
  })
  single_row_id: boolean;

  @Column()
  public text: string;

  @Column({ type: 'enum', enum: NotificationTypes, nullable: true })
  public type: NotificationTypes;

  @Column('text', { array: true })
  public streams: NotificationStreamTypes[];

  @Column()
  public expiry: Date;

  @CreateDateColumn()
  public created_at: Date;

  @UpdateDateColumn()
  public updated_at: Date;

  toResponseObject() {
    return {
      text: this.text,
      type: this.type,
      streams: this.streams,
      expiry: this.expiry.toISOString(),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}