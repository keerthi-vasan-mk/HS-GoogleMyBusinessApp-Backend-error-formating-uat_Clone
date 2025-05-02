import { BaseEntity, Column, Entity, Index, Generated, PrimaryColumn, ManyToOne, JoinColumn,
         CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Location } from './Location';
import { GRefreshToken } from './GRefreshToken';

// Internal interface
interface Credentials {
    refresh_token: string;
    expiry_date: number;
    access_token: string;
}

@Entity('h_streams')
export class Stream extends BaseEntity {
    /**
     * Hootsuite Stream's placement ID
     */
    @PrimaryColumn()
    public pid: string;

    /**
     * Hootsuite User ID
     */
    @PrimaryColumn()
    public uid: string;

    /**
     * Internal Unique identifier
     */
    @Index()
    @Column({ type: 'uuid' })
    @Generated('uuid')
    public uuid: string;

    /**
     * Google Refresh Token Reference
     */
    // @ts-ignore
    @ManyToOne(type => GRefreshToken, {
        eager: true,
        nullable: true
    })
    @JoinColumn()
    public g_refresh_token: GRefreshToken;

    /**
     * Stream Locations
     */
    // @ts-ignore
    @ManyToMany(type => Location, location => location.streams)
    @JoinTable()
    public locations: Location[];

    /**
     * Useful variable to be used on queries to give the total of locations
     */
    public total_locations: number;

    @CreateDateColumn()
    public created_at: Date;

    @UpdateDateColumn()
    public updated_at: Date;

    getCredentials(): Credentials {
        return {
            access_token: this.g_refresh_token.g_access_token.access_token,
            expiry_date: this.g_refresh_token.g_access_token.expires_at,
            refresh_token: this.g_refresh_token.refresh_token,
        };
    }

    /**
     * Method that searches for streams with the same Google User ID.
     *
     * @param {Stream} stream The stream object with the Google User ID to search with.
     * @returns {Promise<Stream[]>} Returns all the streams with the same Google User ID.
     */
    static async findByGoogleUserId(stream: Stream): Promise<Stream[]> {
        return await Stream.createQueryBuilder('stream')
            .leftJoin('stream.g_refresh_token', 'g_refresh_token')
            .where('g_refresh_token.g_user_id = :gid', { gid: stream.g_refresh_token.g_user_id })
            .getMany();
    }
}