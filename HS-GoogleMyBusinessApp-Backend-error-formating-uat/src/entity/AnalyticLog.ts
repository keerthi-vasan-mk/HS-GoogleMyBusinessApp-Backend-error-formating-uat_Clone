import { Entity, BaseEntity, PrimaryColumn, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('analytics')
export class AnalyticLog extends BaseEntity {
  /**
   * Internal identifier
   */
  @PrimaryGeneratedColumn()
  public id: number;

  /**
   * The Hootsuite user ID.
   */
  @PrimaryColumn()
  uid: string;

  /**
   * Total number of API calls made
   * from this user's account.
   */
  @Column({ default: 0 })
  public num_of_api_calls: number;

  /**
   * Total number of replies made
   * to reviews from the HS GMB app
   * from this user's account.
   */
  @Column({ default: 0 })
  public num_of_replies: number;

  /**
   * Total number of answers made
   * to questions from the HS GMB
   * app from this user's account.
   */
  @Column({ default: 0 })
  public num_of_answers: number;

  /**
   * Total number of posts made to
   * questions from the HS GMB app
   * from this user's account.
   */
  @Column({ default: 0 })
  public num_of_posts: number;

  /**
   * The country where the user's
   * requests are coming from.
   */
  @Column({ default: 'NA' })
  public country_of_origin: string;

  @CreateDateColumn()
  public created_at: Date;

  @UpdateDateColumn()
  public updated_at: Date;

  /**
   * Used to convert the master analytic log
   * into a nicer format.
   */
  toResponseObject() {
    return {
      totalNumOfAPICalls: this.num_of_api_calls,
      totalNumOfAnswers: this.num_of_answers,
      totalNumOfPosts: this.num_of_posts,
      totalNumOfReplies: this.num_of_replies,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  }

}