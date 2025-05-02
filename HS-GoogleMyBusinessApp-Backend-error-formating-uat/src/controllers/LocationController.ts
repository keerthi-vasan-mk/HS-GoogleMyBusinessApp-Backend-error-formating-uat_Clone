import { JsonController, Get, UseBefore, Body, Put, Req } from 'routing-controllers';
import { GMBService } from '../services/GMBService';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { Stream } from '../entity/Stream';
import { Location } from '../entity/Location';
import { StreamMiddleware } from '../middleware/StreamMiddleware';
import {
  GetLocationRequest,
  GetAccountLocationResponse,
  LocationBodyResponse,
  PutLocationRequest,
} from '../interfaces/requests';
import { GMBLocation, GMBAccountWithLocation } from '../interfaces/gmb';
import { getManager } from 'typeorm';
import { GenericError, LocationError } from '../types/errors';
import { atob, btoa } from '../utils/GenericUtility';
import { GAuthUtility } from '../utils/GAuthUtility';
import { LoggerService } from '../utils/LoggerService';
import { Request } from 'express';
import { data1mb } from './data1mb.js';

@JsonController()
export class LocationController {
  /**
   * Get a list of available accounts and their locations.
   */
  @Get('/locations')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async list(@Req() req: Request, @Body() locationRequest: GetLocationRequest) {
    LoggerService.logRequest(req);

    const { stream } = locationRequest;

    try {
      let mappedAccountLocations = await this.getMappedLocations(stream);

      // Testing in my account account only
      if (stream.uid === '26233250') {
        mappedAccountLocations = data1mb;
      }

      const reqResponse: GetAccountLocationResponse = {
        success: true,
        accounts: mappedAccountLocations,
      };
      console.log('Testing locations: mappedAccountLocations = ', mappedAccountLocations);
      console.log('Testing locations: reqResponse = ', reqResponse);
      LoggerService.logResponse(req, reqResponse);

      return reqResponse;
    } catch (error) {
      console.log('Testing locations: error = ', error);
      LoggerService.error(`Error getting the location. Error: ${error}`);
      throw error;
    }
  }

  /**
   * Update list/selection of desired locations
   */
  @Put('/locations')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async set(@Req() req: Request, @Body() locationRequest: PutLocationRequest) {
    LoggerService.logRequest(req);

    const { stream, locationIds } = locationRequest;

    try {
      // Get Current Locations for all business accounts
      const gmbLocations = await this.getGMBLocations(stream);

      // Verify if locations were selected
      if (!Array.isArray(locationIds) || locationIds.length === 0)
        throw GenericError.for(LocationError.MISSING_LOCATION_IDS);

      // Make sure there's no duplicate ids
      const uniqueLocationIds = [...new Set(locationIds)];

      // Find data for selected locations (ids)
      const locations: GMBLocation[] = uniqueLocationIds.map((locationId: string) => {
        // Decode location id from base64
        const convertedLocationId = atob(locationId);

        const location = gmbLocations.find((gmbLocation) => gmbLocation.locationNameId === convertedLocationId);

        // Reject request if there's any invalid location id / possible account mismatch?
        if (!location) throw GenericError.for(LocationError.LOCATION_INVALID_IDS);

        // Ensure that none of the selected locations are unverified
        if (!location.isVerified) throw GenericError.for(LocationError.LOCATION_UNVERIFIED);

        return location;
      });

      // Save selected locations
      await this.updateLocations(locations, stream);

      // Get the updated locations to return
      const mappedAccountLocations = await this.getMappedLocations(stream);

      const reqResponse = {
        success: true,
        accounts: mappedAccountLocations,
      };
      LoggerService.logResponse(req, reqResponse);

      return reqResponse;
    } catch (error) {
      LoggerService.error(`Error updating the location. Error: ${error}`);
      throw error;
    }
  }

  // Private Utilities

  /**
   * Get current locations for all user accounts
   *
   * @param {Stream} stream
   */
  private async getGMBLocations(stream: Stream): Promise<GMBLocation[]> {
    const onTokensChange = GAuthUtility.onTokenUpdateHandler(stream.g_refresh_token);
    const gmbService = new GMBService(stream, onTokensChange);

    // Get available accounts
    const gmbBusinessAccounts = await gmbService.getAccounts();

    // Get Locations for all business accounts
    return gmbService.getLocations(gmbBusinessAccounts);
  }

  /**
   * Get current locations for all user accounts
   *
   * @param {Stream} stream
   * @returns {Promise<GMBAccountWithLocation>}
   */
  private async getGMBAccountsWithLocations(stream: Stream): Promise<GMBAccountWithLocation[]> {
    const onTokensChange = GAuthUtility.onTokenUpdateHandler(stream.g_refresh_token);
    const gmbService = new GMBService(stream, onTokensChange);
    // Get accounts with locations.
    return gmbService.getAccountsWithLocations();
  }

  /**
   * Returns locations mapped to accounts and formatted for return to the front.
   *
   * @param {Stream} stream stream to get locations for.
   */
  private async getMappedLocations(stream: Stream) {
    const mappedAccounts: GMBAccountWithLocation[] = [];

    try {
      const currentSavedLocations = await Location.findByStream(stream);

      // Get Current GMB Locations for all business accounts
      const accountsWithLocations = await this.getGMBAccountsWithLocations(stream);

      // Map Locations into a format for front
      accountsWithLocations.forEach((account) => {
        const mappedLocations: GMBLocation[] = [];

        account.locations.forEach((location) => {
          const isSelectedLocation =
            currentSavedLocations.findIndex((savedLocation) => savedLocation.name_id === location.locationNameId) !==
            -1;
          const locationItem: LocationBodyResponse = {
            locationNameId: btoa(location.locationNameId),
            name: location.name,
            address: location.address,
            isActive: isSelectedLocation,
            isVerified: location.isVerified,
            isPublished: location.isPublished,
            canPost: location.canPost,
          };
          mappedLocations.push(locationItem);
        });

        mappedAccounts.push({
          accountNameId: account.accountNameId,
          accountName: account.accountName,
          locations: mappedLocations,
        });
      });
    } catch (error) {
      throw error;
    }

    return mappedAccounts;
  }

  /**
   * Update Locations entity
   *
   * @param {GMBLocation[]} locations
   * @param {Stream} stream
   */
  private async updateLocations(locations: GMBLocation[], stream: Stream) {
    const addedOrUpdatedLocations = [];

    await Promise.all(
      locations.map(async (gmbLocation) => {
        // Used to allow static typing for location data
        const baseModel = {
          uuid: undefined,
          created_at: undefined,
          streams: undefined,
          updated_at: undefined,
          hasId: undefined,
          save: undefined,
          remove: undefined,
          reload: undefined,
        };

        // Location data to be added
        const locationData: Partial<Location> = {
          name_id: gmbLocation.locationNameId,
          location_name: gmbLocation.name,
          address: gmbLocation.address,

          verified: gmbLocation.isVerified,
          local_post_api: gmbLocation.canPost,
          active: gmbLocation.isPublished,
          ...baseModel,
        };

        // Add or Update Location if it already existed
        const locationQuery = await Location.createQueryBuilder()
          .insert() // into(Location)
          .values(locationData)
          .onConflict(
            `("name_id") DO UPDATE SET
                        "location_name" = :location_name,
                        "address" = :address,
                        "verified" = :verified,
                        "local_post_api" = :local_post_api,
                        "active" = :active`,
          )
          .setParameters(locationData)
          .execute();

        // Save ids of added locations so relationships may be created
        addedOrUpdatedLocations.push(...locationQuery.identifiers);
      }),
    );

    // Add and/or remove relationship between Locations and Streams.
    // This will also remove any previous relationship that are no longer true
    stream.locations = addedOrUpdatedLocations;

    await stream.save();

    // TODO: This should be addded to a cron job routine for performance improvement.
    // Clean up Locations entity removing any object that doesn't have
    // a relationship with a Stream
    const entityManager = getManager();

    // This is a complex query not supported by typeORM, so we have to use raw SQL
    await entityManager.query(`DELETE FROM gmb_locations gl
                                  WHERE NOT EXISTS (SELECT * FROM h_streams_locations_gmb_locations hsl
                                                    WHERE hsl."gmbLocationsNameId" = gl.name_id);`);
  }
}
