// MSW server for the React Native runtime (Metro). Used in dev only.
import { setupServer } from 'msw/native';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
