import { runSaga } from 'redux-saga';

import { camelCaseObject } from '@edx/frontend-platform';
import * as actions from '../actions';
import {
  fetchRealtimeValidations,
  handleNewUserRegistration,
} from '../sagas';
import * as api from '../service';
import initializeMockLogging from '../../../setupTest';

const { loggingService } = initializeMockLogging();

describe('fetchRealtimeValidations', () => {
  const params = {
    payload: {
      formData: {
        email: 'test@test.com',
        username: '',
        password: 'test-password',
        name: 'test-name',
        honor_code: true,
        country: 'test-country',
      },
    },
  };

  beforeEach(() => {
    loggingService.logError.mockReset();
  });

  const data = {
    validation_decisions: {
      username: 'Username must be between 2 and 30 characters long.',
    },
  };

  it('should call service and dispatch success action', async () => {
    const getFieldsValidations = jest.spyOn(api, 'getFieldsValidations')
      .mockImplementation(() => Promise.resolve({ fieldValidations: data }));

    const dispatched = [];
    await runSaga(
      { dispatch: (action) => dispatched.push(action) },
      fetchRealtimeValidations,
      params,
    );

    expect(getFieldsValidations).toHaveBeenCalledTimes(1);
    expect(dispatched).toEqual([
      actions.fetchRealtimeValidationsBegin(),
      actions.fetchRealtimeValidationsSuccess(data),
    ]);
    getFieldsValidations.mockClear();
  });

  it('should call service and dispatch error action', async () => {
    const validationRatelimitResponse = {
      response: {
        status: 403,
        data: {
          detail: 'You do not have permission to perform this action.',
        },
      },
    };
    const getFieldsValidations = jest.spyOn(api, 'getFieldsValidations')
      .mockImplementation(() => Promise.reject(validationRatelimitResponse));

    const dispatched = [];
    await runSaga(
      { dispatch: (action) => dispatched.push(action) },
      fetchRealtimeValidations,
      params,
    );

    expect(getFieldsValidations).toHaveBeenCalledTimes(1);
    expect(loggingService.logError).toHaveBeenCalled();
    expect(dispatched).toEqual([
      actions.fetchRealtimeValidationsBegin(),
      actions.fetchRealtimeValidationsFailure(
        validationRatelimitResponse.response.data,
        validationRatelimitResponse.response.status,
      ),
    ]);
    getFieldsValidations.mockClear();
  });
});

describe('handleNewUserRegistration', () => {
  const params = {
    payload: {
      formData: {
        email: 'test@test.com',
        username: 'test-username',
        password: 'test-password',
        name: 'test-name',
        honor_code: true,
        country: 'test-country',
      },
    },
  };

  beforeEach(() => {
    loggingService.logError.mockReset();
  });

  it('should call service and dispatch success action', async () => {
    const data = { redirectUrl: '/dashboard', success: true };
    const registerRequest = jest.spyOn(api, 'registerRequest')
      .mockImplementation(() => Promise.resolve(data));

    const dispatched = [];
    await runSaga(
      { dispatch: (action) => dispatched.push(action) },
      handleNewUserRegistration,
      params,
    );

    expect(registerRequest).toHaveBeenCalledTimes(1);
    expect(dispatched).toEqual([
      actions.registerNewUserBegin(),
      actions.registerNewUserSuccess(data.redirectUrl, data.success),
    ]);
    registerRequest.mockClear();
  });

  it('should handle 500 error code', async () => {
    const registerErrorResponse = {
      response: {
        status: 500,
        data: {
          errorCode: 'internal-server-error',
        },
      },
    };

    const registerRequest = jest.spyOn(api, 'registerRequest').mockImplementation(() => Promise.reject(registerErrorResponse));

    const dispatched = [];
    await runSaga(
      { dispatch: (action) => dispatched.push(action) },
      handleNewUserRegistration,
      params,
    );

    expect(dispatched).toEqual([
      actions.registerNewUserBegin(),
      actions.registerNewUserFailure(camelCaseObject(registerErrorResponse.response.data)),
    ]);
    registerRequest.mockClear();
  });

  it('should call service and dispatch error action', async () => {
    const loginErrorResponse = {
      response: {
        status: 400,
        data: {
          error: 'something went wrong',
        },
      },
    };
    const registerRequest = jest.spyOn(api, 'registerRequest')
      .mockImplementation(() => Promise.reject(loginErrorResponse));

    const dispatched = [];
    await runSaga(
      { dispatch: (action) => dispatched.push(action) },
      handleNewUserRegistration,
      params,
    );

    expect(registerRequest).toHaveBeenCalledTimes(1);
    expect(loggingService.logError).toHaveBeenCalled();
    expect(dispatched).toEqual([
      actions.registerNewUserBegin(),
      actions.registerNewUserFailure(loginErrorResponse.response.data),
    ]);
    registerRequest.mockClear();
  });
});