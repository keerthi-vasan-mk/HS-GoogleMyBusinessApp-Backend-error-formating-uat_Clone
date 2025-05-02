import { BaseEntity, Column, Entity, CreateDateColumn, UpdateDateColumn, ManyToMany,
         Index, Generated, PrimaryColumn } from 'typeorm';
import { Stream } from './Stream';

@Entity('gmb_locations')
export class Location extends BaseEntity {
    /**
     * GMB Location Identifier
     */
    @PrimaryColumn()
    public name_id: string;

    /**
     * Internal Unique identifier
     */
    @Index()
    @Column({ type: 'uuid' })
    @Generated('uuid')
    public uuid: string;

    /**
     * Streams
     */
    // @ts-ignore
    @ManyToMany(type => Stream, stream => stream.locations)
    public streams: Stream[];

    /**
     * Active
     */
    @Column()
    public active: boolean;

    @Column()
    public verified: boolean;

    @Column()
    public local_post_api: boolean;

    @Column()
    public location_name: string;

    @Column()
    public address: string;

    @CreateDateColumn()
    public created_at: Date;

    @UpdateDateColumn()
    public updated_at: Date;

    /**
     * Find a location by a specific stream
     *
     * @static
     * @param {Stream} stream
     * @returns {Promise<Location[]>}
     * @memberof Location
     */
    static async findByStream(stream: Stream): Promise<Location[]> {
        // Find where does not work properly in Child entities
        // https://github.com/typeorm/typeorm/issues/2226
        // `Location.find({ where: { streams: stream } });` would not work in this case.
        // So we need to manually create a query when needed to query
        // an entity by filtering fields from another relationship.

        return Location.createQueryBuilder('location')
        .leftJoin('location.streams', 'stream')
        .where('stream.uid = :uid', { uid: stream.uid })
        .andWhere('stream.pid = :pid', { pid: stream.pid })
        .getMany();
    }
}
