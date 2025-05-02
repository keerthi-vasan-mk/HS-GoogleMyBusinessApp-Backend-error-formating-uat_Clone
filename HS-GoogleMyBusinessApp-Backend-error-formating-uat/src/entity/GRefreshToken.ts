import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, BaseEntity,
         OneToOne, JoinColumn, UpdateDateColumn, Index } from 'typeorm';
import { GAccessToken } from './GAccessToken';

@Entity('g_refresh_tokens')
export class GRefreshToken extends BaseEntity {
    /**
     * Internal identifier
     */
    @PrimaryGeneratedColumn()
    public id: number;

    /**
     * Hootsuite Stream's placement ID
     */
    @Index()
    @Column()
    public pid: string;

    /**
     * Hootsuite User ID
     */
    @Index()
    @Column()
    public uid: string;

    /**
     * Google User Display Name
     */
    @Column({ nullable: true })
    public g_display_name: string;

    /**
     * Google User ID
     */
    @Column()
    public g_user_id: string;

    /**
     * Refresh Token
     */
    @Column()
    public refresh_token: string;

    /**
     * Access Token Reference
     */
    // @ts-ignore
    @OneToOne(type => GAccessToken, {
        eager: true
    })
    @JoinColumn()
    public g_access_token: GAccessToken;

    /**
     * Refresh Token Status
     */
    @Column()
    public revoked: boolean;

    @CreateDateColumn()
    public created_at: Date;

    @UpdateDateColumn()
    public updated_at: Date;

    /**
     * Method that deletes all of the refresh tokens associated with a
     * Google account.
     *
     * @param {String} gid The Google user ID to delete refresh tokens for.
     */
    static async deleteTokensByGoogleId(gid: string): Promise<void> {
        await GRefreshToken.createQueryBuilder('g_refresh_token')
            .delete()
            .from(GRefreshToken)
            .where('g_user_id = :gid', { gid })
            .execute();
    }
}