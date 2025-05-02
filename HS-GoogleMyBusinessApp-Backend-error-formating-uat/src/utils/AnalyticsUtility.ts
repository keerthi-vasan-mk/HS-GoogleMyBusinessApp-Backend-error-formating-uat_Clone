import { getManager, Not } from 'typeorm';
import * as geoip from 'geoip-lite';
import { AnalyticLog } from '../entity/AnalyticLog';
import { MASTER_ANALYTIC_LOG_UID, AnalyticMetrics, NO_COUNTRY_INDEX_FOUND } from '../types/analytics';
import { AnalyticsResponse } from '../interfaces/responses';

/**
 * Utility class that logs and retrieves
 * analytics for the app overall, and per
 * user averages.
 */
export class AnalyticsUtility {

  /**
   * Method that updates or creates a new analytic log
   * if one doesn't exist. Updates the number of API calls
   * and the desired `metric` by the `count` passed in.
   *
   * @param {String} uid A Hootsuite User ID
   * @param {Number} count The amount to increment the given metric by (default 1)
   * @param {AnalyticMetrics} metric The (optional) desired metric to update
   * @returns {Promise<Boolean>} Returns whether the update was successful or not.
   */
  public static async updateAnalyticLog(uid: string, count: number = 1, metric?: AnalyticMetrics): Promise<boolean> {
    let userAnalyticLog = await AnalyticLog.findOne({ uid });

    // If entity doesn't exist, create it with given default values
    if (!userAnalyticLog) {
      userAnalyticLog = AnalyticLog.create();
      userAnalyticLog.uid = uid;
      userAnalyticLog.num_of_api_calls = count;
      if (metric) {
        userAnalyticLog[metric] = count;
      }
    } else {
      userAnalyticLog.num_of_api_calls += count;
      if (metric) {
        userAnalyticLog[metric] += count;
      }
    }

    // Update overall app analytics
    await this.updateOverallAnalyticLog(count, metric);

    return Boolean(await userAnalyticLog.save());
  }

  /**
   * Method that updates or creates a new analytic log
   * if one doesn't exist. It sets the country of origin
   * for the given user based off the given IP address.
   *
   * @param {String} uid The Hootsuite user ID
   * @param {String} ipAddress The request's IP address
   * @returns {Promise<Boolean>} Returns whether the update was successful or not.
   */
  public static async updateAnalyticLogCountry(uid: string, ipAddress: string): Promise<boolean> {
    let userAnalyticLog = await AnalyticLog.findOne({ uid });

    if (!userAnalyticLog) {
      userAnalyticLog = AnalyticLog.create();
      userAnalyticLog.uid = uid;
    }

    userAnalyticLog.country_of_origin = this.getCountryByIp(ipAddress);

    return Boolean(await userAnalyticLog.save());
  }

  /**
   * Method that updates or creates a new master (total for the
   * whole app) analytic log if one doesn't exist. Updates the
   * number of API calls and the desired `metric` by the `count`
   * passed in.
   *
   * @param {Number} count The amount to increment the given metric by (default 1)
   * @param {AnalyticMetrics} metric The (optional) desired metric to update
   * @returns {Promise<Boolean>} Returns whether the update was successful or not.
   */
  public static async updateOverallAnalyticLog(count: number = 1, metric?: AnalyticMetrics): Promise<boolean> {
    let overallAnalyticLog = await AnalyticLog.findOne({ uid: MASTER_ANALYTIC_LOG_UID });

    // If entity doesn't exist, create it with given default values
    if (!overallAnalyticLog) {
      overallAnalyticLog = AnalyticLog.create();
      overallAnalyticLog.uid = MASTER_ANALYTIC_LOG_UID;
      overallAnalyticLog.num_of_api_calls = count;
      if (metric) {
        overallAnalyticLog[metric] = count;
      }
    } else {
      overallAnalyticLog.num_of_api_calls += count;
      if (metric) {
        overallAnalyticLog[metric] += count;
      }
    }

    return Boolean(await overallAnalyticLog.save());
  }

  /**
   * Method that calculates averages and retrieves metrics
   * on a per user basis, as well total application metrics.
   *
   * @returns {Promise<AnalyticsResponse>} Returns the simplified analytics.
   */
  public static async getAnalytics(): Promise<AnalyticsResponse> {
    const entityManager = getManager();

    // Get data in an easy to parse format from the database
    const rawQuery1 = await entityManager.query(`
      SELECT
        COUNT("hStreamsUid")
        FROM h_streams_locations_gmb_locations
        GROUP BY "hStreamsUid" HAVING COUNT("hStreamsUid") > 9
    `);
    const rawQuery2 = await entityManager.query(`
      SELECT
        COUNT("hStreamsUid")
        FROM h_streams_locations_gmb_locations
        GROUP BY "hStreamsUid" HAVING COUNT("hStreamsUid") < 10
    `);
    const rawQuery3 = await entityManager.query(`
      SELECT
        COUNT("hStreamsUid")
        FROM h_streams_locations_gmb_locations
        GROUP BY "hStreamsUid"
    `);
    const allUserAnalyticLogs = await AnalyticLog.find({ uid: Not(MASTER_ANALYTIC_LOG_UID) });
    const totalAppMetrics = await AnalyticLog.findOne({ uid: MASTER_ANALYTIC_LOG_UID });

    // Get location metrics
    const numOfTenOrMoreLocations = rawQuery1.length && Number(rawQuery1[0].count);
    const numOfLessThanTenLocations = rawQuery2.length && Number(rawQuery2[0].count);
    const averageLocationsPerUser = rawQuery3.length && this.averageMetric(rawQuery3.reduce((counter, user) => counter + Number(user.count), 0), rawQuery3.length);

    // Add up all the user metrics, then divide by the total number of user analytic logs
    // to get an average number of API calls, posts, replies, and answers per user
    const allUserAnalyticLogsLength = allUserAnalyticLogs.length;
    const totalUserMetricCounts = allUserAnalyticLogs.reduce((counter, user) => {
      counter.totalNumOfAPICallsPerUser += user.num_of_api_calls;
      counter.totalNumOfPostsPerUser += user.num_of_posts;
      counter.totalNumOfAnswersPerUser += user.num_of_answers;
      counter.totalNumOfRepliesPerUser += user.num_of_replies;
      counter.totalNumOfUsersWhoReplied += user.num_of_replies ? 1 : 0;
      counter.totalPostsPerUserVsTotalPosts += user.num_of_posts / allUserAnalyticLogsLength;

      // If the country already exists, increment its count. Otherwise add the new country along with a count of 1
      const matchingCountryIndex = counter.countries.findIndex(country => country.code === user.country_of_origin);
      if (matchingCountryIndex === NO_COUNTRY_INDEX_FOUND) {
        counter.countries.push({ code: user.country_of_origin, count: 1 });
      } else {
        counter.countries[matchingCountryIndex].count += 1;
      }

      return counter;
    },
      { // Default values for the reduce function
        totalNumOfAPICallsPerUser: 0,
        totalNumOfPostsPerUser: 0,
        totalNumOfAnswersPerUser: 0,
        totalNumOfRepliesPerUser: 0,
        totalNumOfUsersWhoReplied: 0,
        totalPostsPerUserVsTotalPosts: 0,
        countries: []
      }
    );
    const userMetrics = {
      averageNumOfAPICallsPerUser: this.averageMetric(totalUserMetricCounts.totalNumOfAPICallsPerUser, allUserAnalyticLogsLength),
      averageNumOfPostsPerUser: this.averageMetric(totalUserMetricCounts.totalNumOfPostsPerUser, allUserAnalyticLogsLength),
      averageNumOfAnswersPerUser: this.averageMetric(totalUserMetricCounts.totalNumOfAnswersPerUser, allUserAnalyticLogsLength),
      averageNumOfRepliesPerUser: this.averageMetric(totalUserMetricCounts.totalNumOfRepliesPerUser, allUserAnalyticLogsLength)
    };

    // Get total app metrics
    const totalAppMetricsRO = totalAppMetrics
      ? totalAppMetrics.toResponseObject()
      : {
        totalNumOfAPICalls: 0,
        totalNumOfAnswers: 0,
        totalNumOfPosts: 0,
        totalNumOfReplies: 0,
        createdAt: null,
        updatedAt: null
      };
    const totalNumOfUsersWhoReplied = totalUserMetricCounts.totalNumOfUsersWhoReplied;
    const averagePostsPerUserVsTotalPosts = this.averageMetric(totalUserMetricCounts.totalPostsPerUserVsTotalPosts, totalAppMetrics && totalAppMetrics.num_of_posts);

    return {
      locationMetrics: {
        numOfTenOrMoreLocations,
        numOfLessThanTenLocations,
        averageLocationsPerUser
      },
      userMetrics,
      totalAppMetrics: {
        ...totalAppMetricsRO,
        totalNumOfUsersWhoReplied,
        averagePostsPerUserVsTotalPosts
      },
      countries: totalUserMetricCounts.countries
    };
  }

  /**
   * Method that exchanges an IP address for a country code.
   * Returns 'NA' to signify no country was found for the given
   * IP address, or if an error occurred, to prevent request
   * from failing.
   *
   * @param {String} ipAddress
   * @returns {String} Returns a country code.
   */
  private static getCountryByIp(ipAddress: string): string {
    try {
      // Remove the IPV4 subnet prefix to allow proper lookup
      const formattedAddress = ipAddress.replace('::ffff:', '');
      const geoInfo = geoip.lookup(formattedAddress);
      return geoInfo && geoInfo.country || 'NA';
    } catch (error) {
      return 'NA';
    }
  }

  /**
   * Method that returns an average of the given metrics.
   *
   * @param {Number} total
   * @param {Number} length
   * @returns {Number} Returns the average of the given values or 0.
   */
  private static averageMetric(total: number, length: number): number {
    return (Math.round(total / length * 100) / 100) || 0;
  }

}