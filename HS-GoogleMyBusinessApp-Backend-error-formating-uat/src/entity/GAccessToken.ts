import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, BaseEntity, UpdateDateColumn } from 'typeorm';

@Entity('g_access_tokens')
export class GAccessToken extends BaseEntity {
    /**
     * Internal identifier
     */
    @PrimaryGeneratedColumn()
    public id: number;

    /**
     * Access Token
     */
    @Column()
    public access_token: string;

    /**
     * Expires At
     */
    @Column({ type: 'bigint' })
    public expires_at: number;

    @CreateDateColumn()
    public created_at: Date;

    @UpdateDateColumn()
    public updated_at: Date;
}