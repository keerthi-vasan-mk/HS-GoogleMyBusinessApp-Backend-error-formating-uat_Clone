import { ErrorLog } from '../entity/ErrorLog';
import { GMBApiActionTypes } from '../types/google';
import { ErrorLogRO } from '../interfaces/responses';

/**
 * Utility class that logs errors sent
 * from the GMB API on failed requests.
 */
export class LogUtility {
  /**
   * Method that saves logged errors in the database.
   *
   * @param {String} uid The Hootsuite User ID
   * @param {GMBApiActionTypes} apiActionRequest The type of request that was being made
   * @param {any} error The error object from the GMB API
   * @returns {Promise<Boolean>} Returns whether the log was successfully created or not.
   */
  public static async logError(uid: string, apiActionRequest: GMBApiActionTypes, error: any): Promise<boolean> {
    const errorLog = new ErrorLog();

    errorLog.uid = uid;
    errorLog.httpCode = error?.response?.data?.error?.code || -1;
    errorLog.apiActionRequest = apiActionRequest;
    errorLog.error = JSON.stringify(error);

    try {
      return Boolean(await errorLog.save());
    } catch (error) {
      return false;
    }
  }

  /**
   * Method that gets a list of all the logs.
   *
   * @returns {Promise<ErrorLogRO[]>} Returns a list of error logs.
   */
  public static async getLogs(): Promise<ErrorLogRO[]> {
    const logs = await ErrorLog.find({ take: 250, order: { created_at: 'DESC' } });

    return logs.map((log) => log.toResponseObject());
  }
}
