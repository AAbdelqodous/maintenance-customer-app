import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { authApi } from './api/authApi';
import { centerServicesApi } from './api/centerServicesApi';
import { bookingsApi } from './api/bookingsApi';
import { centersApi } from './api/centersApi';
import { chatApi } from './api/chatApi';
import { complaintsApi } from './api/complaintsApi';
import { favoritesApi } from './api/favoritesApi';
import { notificationsApi } from './api/notificationsApi';
import { profileApi } from './api/profileApi';
import { progressApi } from './api/progressApi';
import { mediaApi } from './api/mediaApi';
import { quoteApi } from './api/quoteApi';
import { reviewsApi } from './api/reviewsApi';
import { loyaltyApi } from './api/loyaltyApi';
import { vehiclesApi } from './api/vehiclesApi';
import { remindersApi } from './api/remindersApi';
import { referralApi } from './api/referralApi';
import { quoteRequestsApi } from './api/quoteRequestsApi';
import { paymentsApi } from './api/paymentsApi';
import { walletApi } from './api/walletApi';
import authReducer, { clearSession } from './authSlice';
import bookingsReducer from './bookingsSlice';
import centersReducer from './centersSlice';
import chatReducer from './chatSlice';
import favoritesReducer from './favoritesSlice';
import notificationsReducer from './notificationsSlice';
import uiReducer from './uiSlice';

const unauthorizedMiddleware: import('@reduxjs/toolkit').Middleware = (api) => (next) => (action: any) => {
  if (action?.payload?.status === 401) {
    api.dispatch(clearSession());
  }
  return next(action);
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    centers: centersReducer,
    bookings: bookingsReducer,
    favorites: favoritesReducer,
    notifications: notificationsReducer,
    chat: chatReducer,
    [authApi.reducerPath]: authApi.reducer,
    [centerServicesApi.reducerPath]: centerServicesApi.reducer,
    [centersApi.reducerPath]: centersApi.reducer,
    [bookingsApi.reducerPath]: bookingsApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
    [favoritesApi.reducerPath]: favoritesApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [complaintsApi.reducerPath]: complaintsApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [progressApi.reducerPath]: progressApi.reducer,
    [mediaApi.reducerPath]: mediaApi.reducer,
    [quoteApi.reducerPath]: quoteApi.reducer,
    [loyaltyApi.reducerPath]: loyaltyApi.reducer,
    [vehiclesApi.reducerPath]: vehiclesApi.reducer,
    [remindersApi.reducerPath]: remindersApi.reducer,
    [referralApi.reducerPath]: referralApi.reducer,
    [quoteRequestsApi.reducerPath]: quoteRequestsApi.reducer,
    [paymentsApi.reducerPath]: paymentsApi.reducer,
    [walletApi.reducerPath]: walletApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      unauthorizedMiddleware,
      authApi.middleware,
      centerServicesApi.middleware,
      centersApi.middleware,
      bookingsApi.middleware,
      reviewsApi.middleware,
      favoritesApi.middleware,
      notificationsApi.middleware,
      chatApi.middleware,
      complaintsApi.middleware,
      profileApi.middleware,
      progressApi.middleware,
      mediaApi.middleware,
      quoteApi.middleware,
      loyaltyApi.middleware,
      vehiclesApi.middleware,
      remindersApi.middleware,
      referralApi.middleware,
      quoteRequestsApi.middleware,
      paymentsApi.middleware,
      walletApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
