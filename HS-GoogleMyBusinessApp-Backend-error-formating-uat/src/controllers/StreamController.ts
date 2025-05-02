import { getManager } from 'typeorm';
import { JsonController, Post, UseBefore, Body, Req } from 'routing-controllers';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { StreamMiddleware } from '../middleware/StreamMiddleware';
import { DeleteStreamRequest } from '../interfaces/requests';
import { GAuthUtility } from '../utils/GAuthUtility';
import { GenericError, StreamError } from '../types/errors';
import { Stream } from '../entity/Stream';
import { LoggerService } from '../utils/LoggerService';
import { Request } from 'express';
@JsonController('/streams')
export class StreamController {
  /**
   * Delete a stream. This has to be a 'Post' request as that is how
   * the Hootsuite dashboard calls this endpoint.
   */
  @Post('/delete')
  @UseBefore(StreamMiddleware)
  @UseBefore(AuthMiddleware)
  async deleteStream(@Req() req: Request, @Body() reviewRequest: DeleteStreamRequest) {
    LoggerService.logRequest(req);

    const { stream } = reviewRequest;

    try {
      const refreshToken = stream.g_refresh_token;

      // Remove the stream. This automatically removes the many-to-many relationship to locations
      // in the pivot table.
      await stream.remove();

      // Check if there are any locations without a stream and then delete them.
      const entityManager = getManager();
      await entityManager.query(`DELETE FROM gmb_locations gl
                                  WHERE NOT EXISTS (SELECT * FROM h_streams_locations_gmb_locations hsl
                                                    WHERE hsl."gmbLocationsNameId" = gl.name_id);`);

      // Check to see if the stream's refresh token is being used by any other streams.
      const streamCount = await Stream.count({ g_refresh_token: refreshToken });

      // Invalidate Google tokens if they are no longer being used.
      if (streamCount === 0) {
        await GAuthUtility.revokeGoogleTokens(stream);
      }

      return { success: true };
    } catch (error) {
      LoggerService.error(`Error deleting a stream. Error: ${error}`);
      if (error instanceof GenericError) throw error;
      throw GenericError.for(StreamError.DELETE, error);
    }
  }
}
