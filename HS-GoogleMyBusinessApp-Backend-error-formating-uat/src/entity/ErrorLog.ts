import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { GMBApiActionTypes } from '../types/google';

@Entity('errors')
export class ErrorLog extends BaseEntity {
  /**
   * Internal identifier
   */
  @PrimaryGeneratedColumn()
  public id: number;

  /**
   * The Hootsuite user ID.
   */
  @Column()
  public uid: string;

  /**
   * Error message from Google
   * on failed API request.
   */
  @Column({ type: 'json', nullable: true })
  public error: string;

  /**
   * The HTTP status code from
   * the failed Google API
   * request.
   */
  @Column()
  public httpCode: number;

  /**
   * The action that is being taken
   * when a request is made.
   */
  @Column({ type: 'enum', enum: GMBApiActionTypes, nullable: true })
  public apiActionRequest: GMBApiActionTypes;

  @CreateDateColumn()
  public created_at: Date;

  toResponseObject() {
    return {
      logId: this.id,
      uid: this.uid,
      apiActionRequest: this.apiActionRequest,
      httpCode: this.httpCode,
      error: this.error ? JSON.parse(this.error) : {},
      createdAt: this.created_at,
    };
  }
}
