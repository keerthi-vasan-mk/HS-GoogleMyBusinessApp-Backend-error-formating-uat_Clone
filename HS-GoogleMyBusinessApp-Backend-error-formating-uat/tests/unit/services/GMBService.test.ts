import { GMBService } from '../../../src/services/GMBService';
import { OAuth2Client } from 'google-auth-library';
import { GenericError } from '../../../src/types/errors';
import { GMBLocationResponse } from '../../../src/interfaces/gmb';
jest.mock('google-auth-library');

const mockedClient = new OAuth2Client() as jest.Mocked<OAuth2Client>;
const tokenChange = jest.fn();
const mockStream = {
  created_at: null,
  g_refresh_token: null,
  getCredentials: jest.fn(),
  hasId: jest.fn(),
  locations: null,
  uid: 'kitarmst',
  pid: '3d42d3',
  reload: jest.fn(),
  remove: jest.fn(),
  save: jest.fn(),
  total_locations: null,
  updated_at: null,
  uuid: '123456',
  softRemove: jest.fn(),
  recover: jest.fn(),
};

describe('GMBService', () => {
  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = 'test';
    process.env.GOOGLE_CLIENT_SECRET = 'test';
    process.env.GOOGLE_REDIRECT_URI = 'test';
  });

  afterAll(() => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REDIRECT_URI;
  });

  it('Creates a new service', () => {
    const service = new GMBService(mockStream, tokenChange);
    expect(service).toBeInstanceOf(GMBService);
  });

  describe('Public methods', () => {
    const service = new GMBService(mockStream, tokenChange);

    afterEach(() => {
      mockedClient.request.mockReset();
    });

    describe('`getAccounts` method', () => {
      it('Returns expected user accounts', async () => {
        // Mock the Google API request
        mockedClient.request.mockImplementationOnce(() => {
          return Promise.resolve({
            data: {
              accounts: [
                {
                  accountName: 'test',
                  name: 'test',
                  profilePhotoUrl: 'test',
                  type: 'USER',
                  state: {
                    status: 'test',
                  },
                },
              ],
              nextPageToken: 'test',
            },
          });
        });

        const accounts = await service.getAccounts();

        expect(accounts).toBeDefined();
        expect(accounts.length).toEqual(1);
      });

      it('Throws error', async () => {
        // Mock the Google API request
        mockedClient.request.mockImplementationOnce(() => {
          return Promise.reject('Error');
        });

        try {
          await service.getAccounts();
        } catch (error) {
          expect(error).toBeInstanceOf(GenericError);
        }
      });
    });

    describe('`getLocations` method', () => {
      it('Returns expected locations', async () => {
        const accounts = [
          {
            nameId: 'test',
            accountName: 'test',
            type: 'USER',
            state: 'test',
          },
        ];
        // Mock the Google API request
        mockedClient.request.mockImplementation(() => {
          return Promise.resolve({
            data: {
              locations: [
                {
                  address: {
                    locality: 'test',
                  },
                  name: 'test',
                  isVerified: true,
                  isPublished: true,
                  isLocalPostApiDisabled: false,
                  locationName: 'test',
                },
              ],
            },
          });
        });

        const locations = await service.getLocations(accounts);

        expect(locations).toBeDefined();
        expect(locations.length).toEqual(1);
      });

      it('Throws error', async () => {
        const accounts = [
          {
            nameId: 'test',
            accountName: 'test',
            type: 'USER',
            state: 'test',
          },
        ];
        // Mock the Google API request
        mockedClient.request.mockImplementationOnce(() => {
          return Promise.reject('Error');
        });

        try {
          await service.getLocations(accounts);
        } catch (error) {
          expect(error).toBeInstanceOf(GenericError);
        }
      });
    });

    describe('`getLocationReviews` method', () => {
      it('Returns expected reviews', async () => {
        const reviews = {
          reviews: [{ name: 'test' }, { name: 'test2' }],
        };
        // Mock the Google API request
        mockedClient.request.mockImplementationOnce(() => {
          return Promise.resolve({
            data: reviews,
          });
        });

        const locationReviews = await service.getLocationReviews('test');

        expect(locationReviews).toStrictEqual(reviews);
      });

      it('Throws error', async () => {
        // Mock the Google API request
        mockedClient.request.mockImplementationOnce(() => {
          return Promise.reject('Error');
        });

        try {
          await service.getLocationReviews('test');
        } catch (error) {
          expect(error).toBeInstanceOf(GenericError);
        }
      });
    });

    describe('`getAccountsWithLocations` method', () => {
      it('Returns expected accounts and reviews', async () => {
        // Mock getting accounts
        jest.spyOn(service, 'getAccounts').mockImplementation(() => {
          return Promise.resolve([
            {
              nameId: 'test',
              accountName: 'test',
              state: 'test',
              type: 'test',
            },
          ]);
        });

        // Mock the Google API request for locations
        mockedClient.request.mockImplementation(() => {
          const response: GMBLocationResponse = {
            locations: [
              {
                storefrontAddress: {
                  addressLines: ['test'],
                },
                name: 'test',
                metadata: {
                  canOperateLocalPost: true,
                  hasVoiceOfMerchant: false,
                },
                title: 'test',
              },
            ],
          };

          return Promise.resolve({
            data: response,
          });
        });

        const expectedReviews = [
          {
            accountName: 'test',
            accountNameId: 'test',
            locations: [
              {
                address: 'test',
                canPost: false,
                isPublished: false,
                isVerified: false,
                locationNameId: 'test/test',
                name: 'test',
              },
            ],
          },
        ];

        const reviews = await service.getAccountsWithLocations();

        expect(reviews).toStrictEqual(expectedReviews);
      });

      it('Throws error', async () => {
        // Mock the Google API request
        mockedClient.request.mockImplementationOnce(() => {
          return Promise.reject('Error');
        });

        try {
          await service.getAccountsWithLocations();
        } catch (error) {
          expect(error).toBeInstanceOf(GenericError);
        }
      });
    });

    describe('`removeLocationMedia` method', () => {
      it('Removes location media', async () => {
        const mockLocationName = 'test';

        // Mock the Google API request to delete file
        mockedClient.request.mockImplementationOnce(() => {
          return Promise.resolve({
            data: {
              success: true,
            },
          });
        });

        // This function does not return anything.
        // It only throws an error if something went wrong.
        let error;
        try {
          await service.removeLocationMedia(mockLocationName);
        } catch (err) {
          error = err;
        }

        expect(error).toBeUndefined();
      });

      it('Throws error', async () => {
        const mockLocationName = 'test';

        // Mock the Google API request
        mockedClient.request.mockImplementationOnce(() => {
          return Promise.reject('Error');
        });

        try {
          await service.removeLocationMedia(mockLocationName);
        } catch (error) {
          expect(error).toBeInstanceOf(GenericError);
        }
      });
    });

    describe('`getLocationPost` method', () => {
      it('Returns expected location posts', async () => {
        const mockLocationName = 'test';
        const mockPost = {
          name: 'test',
          state: 'test',
          summary: 'test',
          callToActionL: {},
          createTime: new Date().getTime(),
          updateTime: new Date().getTime(),
          media: [],
        };

        // Mock the Google API request
        mockedClient.request.mockImplementation(() => {
          return Promise.resolve({
            data: mockPost,
          });
        });

        const posts = await service.getLocationPosts(mockLocationName);

        expect(posts).toStrictEqual(mockPost);
      });

      it('Throws error', async () => {
        const mockLocationName = 'test';

        // Mock the Google API request
        mockedClient.request.mockImplementationOnce(() => {
          return Promise.reject('Error');
        });

        try {
          await service.getLocationPosts(mockLocationName);
        } catch (error) {
          expect(error).toBeInstanceOf(GenericError);
        }
      });
    });

    describe('`postLocationPost` method', () => {
      it('Creates a new post', async () => {
        const mockLocationName = 'test';
        const mockPost = {
          name: 'test',
          state: 'test',
          summary: 'test',
          callToActionL: {
            actionType: 'test',
            url: 'test',
          },
          createTime: 'test',
          updateTime: 'test',
        };

        // Mock the Google API request
        mockedClient.request.mockImplementation(() => {
          return Promise.resolve({
            success: true,
            data: mockPost,
          });
        });

        const response = await service.postLocationPost(mockLocationName, mockPost);

        expect(response).toStrictEqual(mockPost);
      });

      it('Throws error', async () => {
        const mockLocationName = 'test';

        // Mock the Google API request
        mockedClient.request.mockImplementationOnce(() => {
          return Promise.reject('Error');
        });

        try {
          await service.getLocationPosts(mockLocationName);
        } catch (error) {
          expect(error).toBeInstanceOf(GenericError);
        }
      });
    });

    describe('`getStartingQuestions` method', () => {
      it('Returns expected questions', async () => {
        const mockLocations = [
          {
            location_name: 'test1',
            address: 'test1',
            name_id: 'test1',
          },
          {
            location_name: 'test2',
            address: 'test2',
            name_id: 'test2',
          },
        ];

        // Mock the Google API request
        mockedClient.request.mockImplementation(() => {
          return Promise.resolve({
            data: {
              questions: [
                {
                  name: 'test',
                  author: {
                    dispalyName: 'test',
                    profilePhotoUrl: 'test',
                    type: 'MERCHANT',
                  },
                  upvoteCount: 1,
                  text: 'test',
                  createTime: 'test',
                  updateTime: 'test',
                  topAnswers: [],
                  totalAnswerCount: 0,
                },
              ],
              totalSize: 1,
              nextPageToken: 'test',
            },
          });
        });

        const response = await service.getStartingQuestions(mockLocations);

        expect(response.length).toEqual(2);
        expect(response[0].locationName).toEqual('test1');
        expect(response[1].locationName).toEqual('test2');
      });

      it('Throws error', async () => {
        const mockLocations = [
          {
            location_name: 'test1',
            address: 'test1',
            name_id: 'test1',
          },
          {
            location_name: 'test2',
            address: 'test2',
            name_id: 'test2',
          },
        ];

        // Mock the Google API request
        mockedClient.request.mockImplementationOnce(() => {
          return Promise.reject('Error');
        });

        try {
          await service.getStartingQuestions(mockLocations);
        } catch (error) {
          expect(error).toBeInstanceOf(GenericError);
        }
      });
    });

    describe('`getLocationQuestions` method', () => {
      it('Returns expected questions', async () => {
        const mockLocationName = 'test';
        const mockQuestions = {
          questions: [
            {
              name: 'test',
              author: {
                dispalyName: 'test',
                profilePhotoUrl: 'test',
                type: 'MERCHANT',
              },
              upvoteCount: 1,
              text: 'test',
              createTime: 'test',
              updateTime: 'test',
              topAnswers: [],
              totalAnswerCount: 0,
            },
          ],
          totalSize: 1,
          nextPageToken: 'test',
        };

        // Mock the Google API request
        mockedClient.request.mockImplementation(() => {
          return Promise.resolve({
            data: mockQuestions,
          });
        });

        const response = await service.getLocationQuestions(mockLocationName);

        expect(response).toStrictEqual(mockQuestions);
      });

      it('Throws error', async () => {
        const mockLocationName = 'test';

        // Mock the Google API request
        mockedClient.request.mockImplementationOnce(() => {
          return Promise.reject('Error');
        });

        try {
          await service.getLocationQuestions(mockLocationName);
        } catch (error) {
          expect(error).toBeInstanceOf(GenericError);
        }
      });
    });

    describe('`putLocationQuestionReply` method', () => {
      it('Updates question reply', async () => {
        const mockQuestionId = 'test';
        const mockText = 'testing';
        const mockResponse = {
          comment: 'testing',
          updateTime: 'testing',
        };

        // Mock the Google API request
        mockedClient.request.mockImplementation(() => {
          return Promise.resolve({
            data: mockResponse,
          });
        });

        const response = await service.putLocationQuestionReply(mockQuestionId, mockText);

        expect(response).toStrictEqual(mockResponse);
      });

      it('Throws error', async () => {
        const mockQuestionId = 'test';
        const mockText = 'testing';

        // Mock the Google API request
        mockedClient.request.mockImplementationOnce(() => {
          return Promise.reject('Error');
        });

        try {
          await service.putLocationQuestionReply(mockQuestionId, mockText);
        } catch (error) {
          expect(error).toBeInstanceOf(GenericError);
        }
      });
    });
  });
});
